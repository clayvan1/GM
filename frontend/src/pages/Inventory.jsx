// src/pages/InventoryManager.jsx
import React, { useState, useEffect } from "react";
import "./InventoryManager.css";
import { Link } from "react-router-dom";
import {
  getInventories,
  createInventory,
  updateInventory,
} from "../Service/InventoryService";

const InventoryManager = () => {
  const [inventories, setInventories] = useState([]);
  const [filteredInventories, setFilteredInventories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    strain_name: "",
    grams_available: "",
    price_per_gram: "",
    buying_price: "",
  });
  const [soldInputs, setSoldInputs] = useState({});
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [modalLoading, setModalLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState({});

  // ✅ Fetch inventories from server
  const fetchInventories = async () => {
    try {
      setLoading(true);
      let inventoriesData = await getInventories();

      // Sort: active first, then ended, by created_at desc
      inventoriesData.sort((a, b) => {
        if (a.ended_at && !b.ended_at) return 1;
        if (!a.ended_at && b.ended_at) return -1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setInventories(inventoriesData);
      setFilteredInventories(inventoriesData);
    } catch (err) {
      console.error("Error fetching inventories:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventories();
  }, []);

  // ✅ Search filter
  useEffect(() => {
    if (!searchTerm) {
      setFilteredInventories(inventories);
      setCurrentPage(1);
      return;
    }

    const lowerTerm = searchTerm.toLowerCase();
    const filtered = inventories.filter((inv) => {
      return (
        inv.strain_name?.toLowerCase().includes(lowerTerm) ||
        String(inv.grams_available).includes(lowerTerm) ||
        String(inv.price_per_gram).includes(lowerTerm) ||
        String(inv.buying_price).includes(lowerTerm) ||
        String(inv.joints?.length || 0).includes(lowerTerm) ||
        String(inv.created_at).includes(lowerTerm) ||
        String(inv.ended_at || "").includes(lowerTerm)
      );
    });

    setFilteredInventories(filtered);
    setCurrentPage(1);
  }, [searchTerm, inventories]);

  // Pagination
  const indexOfLast = currentPage * itemsPerPage;
  const indexOfFirst = indexOfLast - itemsPerPage;
  const currentInventories = filteredInventories.slice(indexOfFirst, indexOfLast);
  const totalPages = Math.ceil(filteredInventories.length / itemsPerPage);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSoldInputChange = (id, field, value) => {
    setSoldInputs({
      ...soldInputs,
      [id]: { ...soldInputs[id], [field]: value },
    });
  };

  // ✅ Update grams sold
  const updateGramsSoldHandler = async (id) => {
    const soldAmount = Number(soldInputs[id]?.grams || 0);
    const soldPrice = Number(soldInputs[id]?.soldPrice || 0);

    if (soldAmount <= 0) return;

    try {
      setUpdateLoading({ ...updateLoading, [id]: true });

      const payload = {
        quantity_sold: soldAmount,
        sale_type: "grams",
        sold_price: soldPrice > 0 ? soldPrice : undefined,
        sold_by: "system",
      };

      const response = await updateInventory(id, payload);

      if (response?.inventory) {
        setInventories((prev) =>
          prev.map((inv) => (inv.id === id ? response.inventory : inv))
        );
        setSoldInputs({ ...soldInputs, [id]: { grams: "", soldPrice: "" } });
      }
    } catch (err) {
      console.error(`[ERROR] Failed to update inventory ${id}:`, err);
    } finally {
      setUpdateLoading({ ...updateLoading, [id]: false });
    }
  };

  // ✅ Create inventory
  const addInventoryHandler = async () => {
    const { strain_name, grams_available, price_per_gram, buying_price } = formData;

    if (!strain_name || !grams_available || !price_per_gram || !buying_price) {
      alert("All fields are required.");
      return;
    }

    try {
      setModalLoading(true);

      const created = await createInventory({
        strain_name,
        grams_available: Number(grams_available),
        price_per_gram: Number(price_per_gram),
        buying_price: Number(buying_price),
      });

      setInventories([...inventories, created.inventory]);
      setFormData({
        strain_name: "",
        grams_available: "",
        price_per_gram: "",
        buying_price: "",
      });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create inventory:", err);
    } finally {
      setModalLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="inventory-container" style={{ textAlign: "center", paddingTop: "150px" }}>
        <div className="loader"></div>
      </div>
    );
  }

  return (
    <div className="inventory-container">
      <header className="inventory-header">
        <h1 className="title">🌿 Inventory Manager</h1>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
          />
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            ➕ Create Inventory
          </button>
        </div>
      </header>

      <div className="table-wrapper">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Strain Name</th>
              <th>Grams Available</th>
              <th>Price per Gram (Ksh)</th>
              <th>Buying Price (Ksh)</th>
              <th>Joints Count</th>
              <th>Created At</th>
              <th>Ended At</th>
              <th>Grams Sold</th>
              <th>Sold Price (Ksh)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentInventories.map((inv) => (
              <tr key={inv.id} className={inv.ended_at ? "ended-row" : ""}>
                <td>{inv.id}</td>
                <td>{inv.strain_name}</td>
                <td>{inv.grams_available}g</td>
                <td>Ksh {inv.price_per_gram}</td>
                <td>Ksh {inv.buying_price}</td>
                <td>{inv.joints?.length || 0}</td>
                <td>{inv.created_at}</td>
                <td>{inv.ended_at || "—"}</td>
                <td>
                  <input
                    type="number"
                    min="1"
                    placeholder="Grams"
                    value={soldInputs[inv.id]?.grams || ""}
                    onChange={(e) => handleSoldInputChange(inv.id, "grams", e.target.value)}
                    style={{ width: "60px", marginRight: "8px" }}
                    disabled={!!inv.ended_at}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    min="0"
                    placeholder="Sold Price"
                    value={soldInputs[inv.id]?.soldPrice || ""}
                    onChange={(e) => handleSoldInputChange(inv.id, "soldPrice", e.target.value)}
                    style={{ width: "80px", marginRight: "8px" }}
                    disabled={!!inv.ended_at}
                  />
                  <button
                    className="btn-update"
                    onClick={() => updateGramsSoldHandler(inv.id)}
                    disabled={!!inv.ended_at || Number(soldInputs[inv.id]?.grams || 0) <= 0 || updateLoading[inv.id]}
                  >
                    {updateLoading[inv.id] ? <span className="loader-small"></span> : "Update"}
                  </button>
                </td>
                <td>
                  <Link
                    to={`/superadmin/inventory/${inv.id}`}
                    className="btn-secondary"
                  >
                    Manage Joints
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          ◀ Prev
        </button>
        <span>
          Page {currentPage} of {totalPages}
        </span>
        <button
          className="btn btn-secondary"
          onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Next ▶
        </button>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <h2>Create New Inventory</h2>
            <div className="form-group">
              <label htmlFor="strain_name">Strain Name</label>
              <input
                id="strain_name"
                type="text"
                name="strain_name"
                value={formData.strain_name}
                onChange={handleChange}
                placeholder="e.g. Durban Poison"
              />
            </div>
            <div className="form-group">
              <label htmlFor="grams_available">Grams Available</label>
              <input
                id="grams_available"
                type="number"
                name="grams_available"
                value={formData.grams_available}
                onChange={handleChange}
                placeholder="e.g. 1000"
              />
            </div>
            <div className="form-group">
              <label htmlFor="price_per_gram">Price per Gram (Ksh)</label>
              <input
                id="price_per_gram"
                type="number"
                name="price_per_gram"
                value={formData.price_per_gram}
                onChange={handleChange}
                placeholder="e.g. 50"
              />
            </div>
            <div className="form-group">
              <label htmlFor="buying_price">Buying Price (Ksh)</label>
              <input
                id="buying_price"
                type="number"
                name="buying_price"
                value={formData.buying_price}
                onChange={handleChange}
                placeholder="e.g. 40"
              />
            </div>
            <div className="modal-actions">
              <button className="btn btn-cancel" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={addInventoryHandler} disabled={modalLoading}>
                {modalLoading ? <span className="loader-small"></span> : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
