// src/services/UserService.jsx
import axios from "axios";

const API_URL = import.meta.env.VITE_API_BASE + "/api/users";

const UserService = {
  // Fetch all users
  getAllUsers: async () => {
    try {
      const response = await axios.get(`${API_URL}/all`);
      return response.data.users || []; // ensure it returns an array
    } catch (error) {
      console.error("Error fetching all users:", error);
      throw error;
    }
  },

  // Fetch only employees (filtering client-side)
  getEmployees: async () => {
    try {
      const allUsers = await UserService.getAllUsers();
      return allUsers.filter(user => user.role === "employee");
    } catch (error) {
      console.error("Error fetching employees:", error);
      throw error;
    }
  },

  // Assign/update user role
  updateUserRole: async (userId, role) => {
    try {
      const response = await axios.put(`${API_URL}/${userId}/role`, { role });
      return response.data;
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  },
};


export default UserService;
