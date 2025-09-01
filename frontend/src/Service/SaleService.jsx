// src/Service/SaleService.jsx
import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE + "/api/sales";

// --- Fetch all sales ---
export const getSales = async () => {
  try {
    const res = await axios.get(API_BASE);
    return res.data.sales;
  } catch (err) {
    console.error("Error fetching sales:", err);
    throw err;
  }
};

// --- Create a new sale ---
export const createSale = async (saleData) => {
  try {
    const res = await axios.post(API_BASE, saleData);
    return res.data.sale;
  } catch (err) {
    console.error("Error creating sale:", err.response?.data || err.message);
    throw err;
  }
};

// --- Get sale by ID ---
export const getSaleById = async (id) => {
  try {
    const res = await axios.get(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error fetching sale:", err);
    throw err;
  }
};

// --- Delete sale ---
export const deleteSale = async (id) => {
  try {
    const res = await axios.delete(`${API_BASE}/${id}`);
    return res.data;
  } catch (err) {
    console.error("Error deleting sale:", err);
    throw err;
  }
};
