// src/Service/JointService.jsx
import localforage from "localforage";

const API_BASE = import.meta.env.VITE_API_BASE + "/api/joints";

const jointCache = localforage.createInstance({ name: "joints" });

// ================== Fetch all joints ==================
export const getJoints = async () => {
  const cacheKey = "allJoints";
  const cached = await jointCache.getItem(cacheKey);

  if (cached) {
    // Refresh cache in background
    fetch(API_BASE)
      .then(res => res.json())
      .then(data => {
        const joints = Array.isArray(data.joints) ? data.joints : [];
        jointCache.setItem(cacheKey, joints);
      })
      .catch(() => {});
    return cached;
  }

  const res = await fetch(API_BASE);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  const data = await res.json();
  const joints = Array.isArray(data.joints) ? data.joints : [];
  await jointCache.setItem(cacheKey, joints);
  return joints;
};

// ================== Refresh full cache ==================
const refreshFullCache = async () => {
  try {
    const res = await fetch(API_BASE);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const joints = Array.isArray(data.joints) ? data.joints : [];
    await jointCache.setItem("allJoints", joints);
    return joints;
  } catch (err) {
    console.error("❌ refreshFullCache error:", err.message);
    return [];
  }
};

// ================== Create joint ==================
export const createJoint = async (joint) => {
  try {
    const res = await fetch(API_BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(joint),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `API failed: ${res.status}`);
    }

    await refreshFullCache(); // Always refresh cache after creation
    return await getJoints();
  } catch (err) {
    console.error("❌ createJoint error:", err.message);
    // Offline fallback
    const offlineJoint = { id: Date.now(), ...joint, offline: true };
    let all = (await jointCache.getItem("allJoints")) || [];
    if (!Array.isArray(all)) all = [];
    all.push(offlineJoint);
    await jointCache.setItem("allJoints", all);
    return all;
  }
};

// ================== Update joint ==================
export const updateJoint = async (id, updates) => {
  try {
    const res = await fetch(`${API_BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `API failed: ${res.status}`);
    }

    await refreshFullCache(); // Always refresh cache after update
    return await getJoints();
  } catch (err) {
    console.error("❌ updateJoint error:", err.message);
    throw err;
  }
};

// ================== Delete joint ==================
export const deleteJoint = async (id) => {
  try {
    const res = await fetch(`${API_BASE}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `API failed: ${res.status}`);
    }

    await refreshFullCache(); // Always refresh cache after deletion
    return await getJoints();
  } catch (err) {
    console.error("❌ deleteJoint error:", err.message);
    // Offline fallback
    let all = (await jointCache.getItem("allJoints")) || [];
    if (!Array.isArray(all)) all = [];
    all = all.filter(j => Number(j.id) !== Number(id));
    await jointCache.setItem("allJoints", all);
    return all;
  }
};

// ================== Get joints by employee ==================
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
