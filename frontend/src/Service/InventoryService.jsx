// src/services/inventoryService.jsx
import axios from "axios";
import localforage from "localforage";

const INVENTORY_API = import.meta.env.VITE_API_BASE + "/api/inventory";
const SALES_API = import.meta.env.VITE_API_BASE + "/api/sales";

// LocalForage instances
const offlineQueue = localforage.createInstance({ name: "appQueue" });
const inventoryCache = localforage.createInstance({ name: "inventoryCache" });
const salesCache = localforage.createInstance({ name: "salesCache" });

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
      if (item.entity === "inventory") {
        if (item.type === "update")
          await axios.put(`${INVENTORY_API}/${item.id}`, item.payload);
        else if (item.type === "create")
          await axios.post(`${INVENTORY_API}/`, item.payload);
        else if (item.type === "delete")
          await axios.delete(`${INVENTORY_API}/${item.id}`);
      } else if (item.entity === "sale") {
        if (item.type === "create")
          await axios.post(`${SALES_API}/`, item.payload);
        else if (item.type === "delete")
          await axios.delete(`${SALES_API}/${item.id}`);
      }
    } catch (err) {
      console.error("Failed syncing item:", item, err);
      return; // stop if one fails
    }
  }

  await offlineQueue.setItem("updates", []); // clear queue
  await refreshInventoryCache();
  await refreshSalesCache();
};

// --- Cache helpers ---
const refreshInventoryCache = async () => {
  try {
    const res = await axios.get(`${INVENTORY_API}/`);
    await inventoryCache.setItem("inventories", res.data.inventories);
    return res.data.inventories;
  } catch (err) {
    console.error("Error refreshing inventory cache:", err);
    return [];
  }
};

const refreshSalesCache = async () => {
  try {
    const res = await axios.get(`${SALES_API}/`);
    await salesCache.setItem("sales", res.data.sales);
    return res.data.sales;
  } catch (err) {
    console.error("Error refreshing sales cache:", err);
    return [];
  }
};

// =======================
// INVENTORY FUNCTIONS
// =======================

// Fetch inventories (cached)
export const getInventories = async () => {
  try {
    const cached = await inventoryCache.getItem("inventories");
    if (cached && cached.length) return cached;

    const res = await axios.get(`${INVENTORY_API}/`);
    await inventoryCache.setItem("inventories", res.data.inventories);
    return res.data.inventories;
  } catch (err) {
    console.error("Error fetching inventories:", err);
    const cached = await inventoryCache.getItem("inventories");
    return cached || [];
  }
};

// Create inventory
export const createInventory = async (payload) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ entity: "inventory", type: "create", payload });
      return { message: "Create queued (offline)", inventory: payload };
    }
    const res = await axios.post(`${INVENTORY_API}/`, payload);
    await refreshInventoryCache();
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
      await queueUpdate({ entity: "inventory", type: "update", id, payload });
      return { message: "Update queued (offline)", inventory: { id, ...payload } };
    }
    const res = await axios.put(`${INVENTORY_API}/${id}`, payload);
    await refreshInventoryCache();
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
      await queueUpdate({ entity: "inventory", type: "delete", id });
      return { message: "Delete queued (offline)", id };
    }
    const res = await axios.delete(`${INVENTORY_API}/${id}`);
    await refreshInventoryCache();
    return res.data;
  } catch (err) {
    console.error(`Error deleting inventory ${id}:`, err);
    throw err;
  }
};

// =======================
// SALES FUNCTIONS
// =======================

// Fetch sales (cached)
export const getSales = async () => {
  try {
    const cached = await salesCache.getItem("sales");
    if (cached && cached.length) return cached;

    const res = await axios.get(`${SALES_API}/`);
    await salesCache.setItem("sales", res.data.sales);
    return res.data.sales;
  } catch (err) {
    console.error("Error fetching sales:", err);
    const cached = await salesCache.getItem("sales");
    return cached || [];
  }
};

// Create sale
export const createSale = async (payload) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ entity: "sale", type: "create", payload });
      return { message: "Sale queued (offline)", sale: payload };
    }
    const res = await axios.post(`${SALES_API}/`, payload);
    await refreshSalesCache();
    return res.data;
  } catch (err) {
    console.error("Error creating sale:", err);
    throw err;
  }
};

// Delete sale
export const deleteSale = async (id) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ entity: "sale", type: "delete", id });
      return { message: "Delete queued (offline)", id };
    }
    const res = await axios.delete(`${SALES_API}/${id}`);
    await refreshSalesCache();
    return res.data;
  } catch (err) {
    console.error(`Error deleting sale ${id}:`, err);
    throw err;
  }
};
