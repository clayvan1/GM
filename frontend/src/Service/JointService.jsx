// src/services/JointService.jsx
import localforage from "localforage";

// LocalForage instance for joints
const jointCache = localforage.createInstance({ name: "jointCache" });

// --- Fetch all joints ---
export const getJoints = async () => {
  const cached = await jointCache.getItem("allJoints");
  return cached || [];
};

// --- Fetch joints assigned to a specific employee ---
export const getJointsByEmployee = async (employeeId) => {
  const cacheKey = `employee_${employeeId}`;
  const cached = await jointCache.getItem(cacheKey);
  return cached || [];
};

// --- Create joint locally ---
export const createJoint = async (joint) => {
  const allJoints = (await jointCache.getItem("allJoints")) || [];
  const newJoint = { id: Date.now(), ...joint }; // generate temporary id
  allJoints.push(newJoint);
  await jointCache.setItem("allJoints", allJoints);

  // Update per-employee cache if assigned
  if (joint.userId) {
    const key = `employee_${joint.userId}`;
    const empJoints = (await jointCache.getItem(key)) || [];
    empJoints.push(newJoint);
    await jointCache.setItem(key, empJoints);
  }

  return newJoint;
};

// --- Update joint locally ---
export const updateJoint = async (id, payload) => {
  let allJoints = (await jointCache.getItem("allJoints")) || [];
  allJoints = allJoints.map(j => (j.id === id ? { ...j, ...payload } : j));
  await jointCache.setItem("allJoints", allJoints);

  // Update per-employee cache if assigned
  if (payload.userId) {
    const key = `employee_${payload.userId}`;
    let empJoints = (await jointCache.getItem(key)) || [];
    empJoints = empJoints.map(j => (j.id === id ? { ...j, ...payload } : j));
    await jointCache.setItem(key, empJoints);
  }

  return allJoints.find(j => j.id === id);
};

// --- Delete joint locally ---
export const deleteJoint = async (id) => {
  let allJoints = (await jointCache.getItem("allJoints")) || [];
  const jointToDelete = allJoints.find(j => j.id === id);
  allJoints = allJoints.filter(j => j.id !== id);
  await jointCache.setItem("allJoints", allJoints);

  // Remove from employee cache if assigned
  if (jointToDelete?.userId) {
    const key = `employee_${jointToDelete.userId}`;
    let empJoints = (await jointCache.getItem(key)) || [];
    empJoints = empJoints.filter(j => j.id !== id);
    await jointCache.setItem(key, empJoints);
  }

  return { success: true, deletedId: id };
};

// --- Assign joint to employee locally ---
export const assignJoint = async (id, userId) => {
  let allJoints = (await jointCache.getItem("allJoints")) || [];
  const joint = allJoints.find(j => j.id === id);
  if (!joint) return null;

  joint.userId = userId;
  await jointCache.setItem("allJoints", allJoints);

  // Add to employee cache
  const key = `employee_${userId}`;
  const empJoints = (await jointCache.getItem(key)) || [];
  if (!empJoints.find(j => j.id === id)) {
    empJoints.push(joint);
    await jointCache.setItem(key, empJoints);
  }

  return joint;
};

// --- Initialize cache manually ---
export const initializeCache = async (joints) => {
  await jointCache.setItem("allJoints", joints || []);

  // Build per-employee cache
  const employeeMap = {};
  (joints || []).forEach(j => {
    if (j.userId) {
      if (!employeeMap[j.userId]) employeeMap[j.userId] = [];
      employeeMap[j.userId].push(j);
    }
  });

  for (const [userId, empJoints] of Object.entries(employeeMap)) {
    await jointCache.setItem(`employee_${userId}`, empJoints);
  }
};
