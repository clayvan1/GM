// src/services/JointService.jsx
import axios from "axios";
import localforage from "localforage";

const API_BASE = import.meta.env.VITE_API_BASE + "/api/joints";

// LocalForage instance for offline queue
const offlineQueue = localforage.createInstance({ name: "jointQueue" });

// --- Offline Queue Helpers ---
const queueUpdate = async (update) => {
  const queued = (await offlineQueue.getItem("updates")) || [];
  queued.push(update);
  await offlineQueue.setItem("updates", queued);
};

export const syncOfflineChanges = async () => {
  const queued = (await offlineQueue.getItem("updates")) || [];
  if (!queued.length) return;

  console.log("Syncing offline joint changes:", queued);

  for (let item of queued) {
    try {
      if (item.type === "update") {
        await axios.put(`${API_BASE}/${item.id}`, item.payload);
      } else if (item.type === "create") {
        await axios.post(`${API_BASE}/`, item.payload);
      } else if (item.type === "delete") {
        await axios.delete(`${API_BASE}/${item.id}`);
      } else if (item.type === "assign") {
        await axios.put(`${API_BASE}/${item.id}/assign`, item.payload);
      }
    } catch (err) {
      console.error("Failed syncing item:", item, err);
      return; // stop on first failure
    }
  }

  await offlineQueue.setItem("updates", []); // clear queue after sync
};

// --- Joint API Calls ---

// Fetch all joints
export const getJoints = async () => {
  try {
    const res = await axios.get(`${API_BASE}/`);
    return res.data.joints || [];
  } catch (err) {
    console.error("Error fetching joints:", err);
    return [];
  }
};

// Create a new joint
export const createJoint = async (payload) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ type: "create", payload });
      return { message: "Create queued (offline)", joint: payload };
    }
    const res = await axios.post(`${API_BASE}/`, payload);
    return res.data;
  } catch (err) {
    console.error("Error creating joint:", err);
    throw err;
  }
};

// Update a joint
export const updateJoint = async (id, payload) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ type: "update", id, payload });
      return { message: "Update queued (offline)", joint: { id, ...payload } };
    }
    const res = await axios.put(`${API_BASE}/${id}`, payload);
    return res.data;
  } catch (err) {
    console.error(`Error updating joint ${id}:`, err);
    throw err;
  }
};

// Delete a joint
export const deleteJoint = async (id) => {
  try {
    if (!navigator.onLine) {
      await queueUpdate({ type: "delete", id });
      return { message: "Delete queued (offline)", id };
    }
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    console.error(`Error deleting joint ${id}:`, err);
    throw err;
  }
};

// Assign a joint to an employee
export const assignJoint = async (id, userId) => {
  const payload = { user_id: userId };
  try {
    if (!navigator.onLine) {
      await queueUpdate({ type: "assign", id, payload });
      return { message: "Assign queued (offline)", joint: { id, userId } };
    }
    const res = await axios.put(`${API_BASE}/${id}/assign`, payload);
    return res.data;
  } catch (err) {
    console.error(`Error assigning joint ${id}:`, err);
    throw err;
  }
};

// Fetch joints assigned to a specific employee
export const getJointsByEmployee = async (employeeId) => {
  try {
    const res = await axios.get(`${API_BASE}/employee/${employeeId}`);
    return res.data.joints || [];
  } catch (err) {
    console.error(`Error fetching joints for employee ${employeeId}:`, err);
    return [];
  }
};
