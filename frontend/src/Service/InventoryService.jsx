// src/services/inventoryService.jsx
import axios from "axios";
import localforage from "localforage";

const API_BASE = import.meta.env.VITE_API_BASE + "/api/inventory";

// LocalForage instance to queue offline updates
const offlineQueue = localforage.createInstance({
  name: "inventoryQueue",
});

// --- Offline Queue Helper ---
const queueUpdate = async (update) => {
  const queued = (await offlineQueue.getItem("updates")) || [];
  queued.push(update);
  await offlineQueue.setItem("updates", queued);
};

// --- Sync offline changes ---
export const syncOfflineChanges = async () => {
  const queued = (await offlineQueue.getItem("updates")) || [];
  if (!queued.length) return;

  console.log("Syncing offline changes:", queued);

  for (let item of queued) {
    try {
      if (item.type === "update") {
        await axios.put(`${API_BASE}/${item.id}`, item.payload);
      } else if (item.type === "create") {
        await axios.post(`${API_BASE}/`, item.payload);
      } else if (item.type === "delete") {
        await axios.delete(`${API_BASE}/${item.id}`);
      }
    } catch (err) {
      console.error("Failed syncing item:", item, err);
      return; // stop syncing if one fails
    }
  }

  await offlineQueue.setItem("updates", []); // clear queue
};

// --- Inventory API Calls with offline support ---

// Fetch inventories
export const getInventories = async () => {
  try {
    const res = await axios.get(`${API_BASE}/`);
    return res.data.inventories; // adjust to match your API
  } catch (err) {
    console.error("Error fetching inventories:", err);
    return []; // fallback to empty array if offline
  }
};

// Create inventory
export const createInventory = async (payload) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ type: "create", payload });
      console.log("Queued create (offline):", payload);
      return { message: "Create queued (offline)", inventory: payload };
    }

    const res = await axios.post(`${API_BASE}/`, payload);
    return res.data;
  } catch (err) {
    console.error("Error creating inventory:", err);
    throw err;
  }
};

// Update inventory
export const updateInventory = async (id, payload) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ type: "update", id, payload });
      console.log("Queued update (offline):", id);
      return { message: "Update queued (offline)", inventory: { id, ...payload } };
    }

    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    console.error(`Error updating inventory ${id}:`, err);
    throw err;
  }
};

// Delete inventory
export const deleteInventory = async (id) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ type: "delete", id });
      console.log("Queued delete (offline):", id);
      return { message: "Delete queued (offline)", id };
    }

    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error deleting inventory ${id}:`, err);
    throw err;
  }
};
