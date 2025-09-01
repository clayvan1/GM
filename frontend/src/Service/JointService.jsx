// src/Service/JointService.js
import localforage from "localforage";

const API_BASE = import.meta.env.VITE_API_BASE + "/api/joints"; 

// Cache setup
const jointCache = localforage.createInstance({ name: "joints" });

/** Fetch all joints */
// src/Service/JointService.js
// src/Service/JointService.js
export const getJoints = async () => {
  const cached = await jointCache.getItem("allJoints");
  if (cached) {
    // Return cached immediately
    fetch(`${API_BASE}/`)
      .then(res => res.json())
      .then(data => {
        const joints = Array.isArray(data) ? data : [];
        jointCache.setItem("allJoints", joints);
      })
      .catch(() => {}); // fail silently in background
    return cached;
  }

  // If cache empty, fetch normally
  const res = await fetch(`${API_BASE}/`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const joints = Array.isArray(data) ? data : [];
  await jointCache.setItem("allJoints", joints);
  return joints;
};
export const createJoint = async (joint) => {
  try {
    const res = await fetch(`${API_BASE}/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(joint),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `API failed: ${res.status}`);
    }

    const data = await res.json();
    const newJoint = data; // ✅ fix here

    console.log("✅ Created joint:", newJoint);

    let all = (await jointCache.getItem("allJoints")) || [];
    if (!Array.isArray(all)) all = [];
    await jointCache.setItem("allJoints", [...all, newJoint]);

    return newJoint;
  } catch (err) {
    console.error("❌ createJoint error:", err.message);

    const offlineJoint = { id: Date.now(), ...joint, offline: true };
    let all = (await jointCache.getItem("allJoints")) || [];
    if (!Array.isArray(all)) all = [];
    await jointCache.setItem("allJoints", [...all, offlineJoint]);

    return offlineJoint;
  }
};

/** Update an existing joint */
export const updateJoint = async (id, updates) => {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) throw new Error(`API failed: ${res.status}`);

    const updated = await res.json();

    const all = (await jointCache.getItem("allJoints")) || [];
    const newAll = all.map((j) => (j.id === id ? updated : j));
    await jointCache.setItem("allJoints", newAll);

    return updated;
  } catch (err) {
    console.error("❌ updateJoint error:", err.message);
    throw err;
  }
};

/** Delete a joint */
export const deleteJoint = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) throw new Error(`API failed: ${res.status}`);

    const result = await res.json();

    const all = (await jointCache.getItem("allJoints")) || [];
    const newAll = all.filter((j) => j.id !== id);
    await jointCache.setItem("allJoints", newAll);

    return result;
  } catch (err) {
    console.error("❌ deleteJoint error:", err.message);
    throw err;
  }
};

/** Get joints for a specific employee */
export const getJointsByEmployee = async (employeeId) => {
  try {
    const res = await fetch(`${API_BASE}/employee/${employeeId}`);
    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    return Array.isArray(data.joints) ? data.joints : [];
  } catch (err) {
    console.error("❌ getJointsByEmployee error:", err.message);
    return [];
  }
};
