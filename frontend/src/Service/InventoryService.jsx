// src/services/inventoryService.jsx
import axios from "axios";
import localforage from "localforage";

const API_BASE = import.meta.env.VITE_API_BASE + "/api/inventory";

// LocalForage instances
const offlineQueue = localforage.createInstance({ name: "inventoryQueue" });
const inventoryCache = localforage.createInstance({ name: "inventoryCache" });

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
      if (item.type === "update") await axios.put(`${API_BASE}/${item.id}`, item.payload);
      else if (item.type === "create") await axios.post(`${API_BASE}/`, item.payload);
      else if (item.type === "delete") await axios.delete(`${API_BASE}/${item.id}`);
    } catch (err) {
      console.error("Failed syncing item:", item, err);
      return; // stop if one fails
    }
  }

  await offlineQueue.setItem("updates", []); // clear queue
  await refreshCache(); // refresh cache after sync
};

// --- Cache helper ---
const refreshCache = async () => {
  try {
    const res = await axios.get(`${API_BASE}/`);
    await inventoryCache.setItem("inventories", res.data.inventories);
    return res.data.inventories;
  } catch (err) {
    console.error("Error refreshing cache:", err);
    return [];
  }
};

// --- Inventory API Calls with caching ---

// Fetch inventories (cached)
export const getInventories = async () => {
  try {
    // Try cache first
    const cached = await inventoryCache.getItem("inventories");
    if (cached && cached.length) return cached;

    // If cache empty, fetch from server
    const res = await axios.get(`${API_BASE}/`);
    await inventoryCache.setItem("inventories", res.data.inventories);
    return res.data.inventories;
  } catch (err) {
    console.error("Error fetching inventories:", err);
    // Fallback: return cache even if outdated
    const cached = await inventoryCache.getItem("inventories");
    return cached || [];
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
    await refreshCache(); // update cache
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
    await refreshCache(); // update cache
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
    await refreshCache(); // update cache
    return res.data;
  } catch (err) {
    console.error(`Error deleting inventory ${id}:`, err);
    throw err;
  }
};
