// src/services/UserService.jsx
import axios from "axios";
import localforage from "localforage";

const API_URL = import.meta.env.VITE_API_BASE + "/api/users";

// LocalForage instance for caching
const userCache = localforage.createInstance({ name: "userCache" });

const UserService = {
  // --- Fetch all users (cached) ---
  getAllUsers: async () => {
    try {
      const cached = await userCache.getItem("allUsers");
      if (cached && cached.length) return cached;

      const response = await axios.get(`${API_URL}/all`);
      const users = response.data.users || [];
      await userCache.setItem("allUsers", users);
      return users;
    } catch (error) {
      console.error("Error fetching all users:", error);
      const cached = await userCache.getItem("allUsers");
      return cached || [];
    }
  },

  // --- Fetch only employees (cached) ---
  getEmployees: async () => {
    try {
      const cacheKey = "employees";
      const cached = await userCache.getItem(cacheKey);
      if (cached && cached.length) return cached;

      const allUsers = await UserService.getAllUsers();
      const employees = allUsers.filter(user => user.role === "employee");
      await userCache.setItem(cacheKey, employees);
      return employees;
    } catch (error) {
      console.error("Error fetching employees:", error);
      const cached = await userCache.getItem("employees");
      return cached || [];
    }
  },

  // --- Assign/update user role ---
  updateUserRole: async (userId, role) => {
    try {
      const response = await axios.put(`${API_URL}/${userId}/role`, { role });

      // Refresh cached users and employees after update
      const allUsers = await UserService.getAllUsers(); // refetch from server
      await userCache.setItem("allUsers", allUsers);
      const employees = allUsers.filter(user => user.role === "employee");
      await userCache.setItem("employees", employees);

      return response.data;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },
};

export default UserService;
