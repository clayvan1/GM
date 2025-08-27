// src/pages/Inventory.jsx
import React, { useState, useEffect } from "react";
import "./InventoryManager.css";
import { Link } from "react-router-dom";
import { getInventories, createInventory, updateInventory } from "../Service/InventoryService";

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

  // --- Filters/Search ---
  const [searchStrain, setSearchStrain] = useState("");
  const [minGrams, setMinGrams] = useState("");
  const [maxGrams, setMaxGrams] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  // Fetch inventories from server
  const fetchInventories = async () => {
    try {
      setLoading(true);
      const inventoriesData = await getInventories();
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

  // Apply filters whenever search/filter inputs change
  useEffect(() => {
    let filtered = [...inventories];

    if (searchStrain) {
      filtered = filtered.filter((inv) =>
        inv.strain_name.toLowerCase().includes(searchStrain.toLowerCase())
      );
    }
    if (minGrams) {
      filtered = filtered.filter((inv) => inv.grams_available >= Number(minGrams));
    }
    if (maxGrams) {
      filtered = filtered.filter((inv) => inv.grams_available <= Number(maxGrams));
    }
    if (minPrice) {
      filtered = filtered.filter((inv) => inv.price_per_gram >= Number(minPrice));
    }
    if (maxPrice) {
      filtered = filtered.filter((inv) => inv.price_per_gram <= Number(maxPrice));
    }

    setFilteredInventories(filtered);
    setCurrentPage(1); // Reset page when filtering
  }, [searchStrain, minGrams, maxGrams, minPrice, maxPrice, inventories]);

  // Pagination logic
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

  const updateGramsSoldHandler = async (id) => {
    const soldAmount = Number(soldInputs[id]?.grams || 0);
    const soldPrice = Number(soldInputs[id]?.soldPrice || 0);

    if (soldAmount <= 0) return;

    try {
      const inv = inventories.find((i) => i.id === id);
      const updated = await updateInventory(id, {
        grams_available: Math.max(inv.grams_available - soldAmount, 0),
        sold_price: soldPrice > 0 ? soldPrice : inv.sold_price || 0,
      });

      setInventories((prev) =>
        prev.map((i) => (i.id === id ? { ...i, ...updated.inventory } : i))
      );
    } catch (err) {
      console.error("Failed to update inventory:", err);
    }

    setSoldInputs({ ...soldInputs, [id]: { grams: "", soldPrice: "" } });
  };

  const addInventoryHandler = async () => {
    const { strain_name, grams_available, price_per_gram, buying_price } = formData;

    if (!strain_name || !grams_available || !price_per_gram || !buying_price) return;

    try {
      const created = await createInventory({
        strain_name,
        grams_available: Number(grams_available),
        price_per_gram: Number(price_per_gram),
        buying_price: Number(buying_price),
      });

      setInventories([...inventories, created.inventory]);
      setFormData({ strain_name: "", grams_available: "", price_per_gram: "", buying_price: "" });
      setShowForm(false);
    } catch (err) {
      console.error("Failed to create inventory:", err);
    }
  };

  if (loading) return <div className="inventory-container">Loading...</div>;

  return (
    <div className="inventory-container">
      <header className="inventory-header">
        <h1 className="title">🌿 Inventory Manager</h1>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          ➕ Create Inventory
        </button>
      </header>

      {/* Search and Filters */}
      <div className="inventory-filters">
        <input
          type="text"
          placeholder="Search by strain"
          value={searchStrain}
          onChange={(e) => setSearchStrain(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min grams"
          value={minGrams}
          onChange={(e) => setMinGrams(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max grams"
          value={maxGrams}
          onChange={(e) => setMaxGrams(e.target.value)}
        />
        <input
          type="number"
          placeholder="Min price"
          value={minPrice}
          onChange={(e) => setMinPrice(e.target.value)}
        />
        <input
          type="number"
          placeholder="Max price"
          value={maxPrice}
          onChange={(e) => setMaxPrice(e.target.value)}
        />
      </div>

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
              <tr key={inv.id}>
                <td data-label="ID">{inv.id}</td>
                <td data-label="Strain Name">{inv.strain_name}</td>
                <td data-label="Grams Available">{inv.grams_available}g</td>
                <td data-label="Price per Gram">Ksh {inv.price_per_gram}</td>
                <td data-label="Buying Price">Ksh {inv.buying_price}</td>
                <td data-label="Joints Count">{inv.joints?.length || 0}</td>
                <td data-label="Created At">{inv.created_at}</td>
                <td data-label="Ended At">{inv.ended_at || "—"}</td>
                <td data-label="Grams Sold">
                  <input
                    type="number"
                    min="1"
                    placeholder="Grams"
                    value={soldInputs[inv.id]?.grams || ""}
                    onChange={(e) => handleSoldInputChange(inv.id, "grams", e.target.value)}
                    style={{ width: "60px", marginRight: "8px" }}
                  />
                </td>
                <td data-label="Sold Price">
                  <input
                    type="number"
                    min="0"
                    placeholder="Sold Price"
                    value={soldInputs[inv.id]?.soldPrice || ""}
                    onChange={(e) => handleSoldInputChange(inv.id, "soldPrice", e.target.value)}
                    style={{ width: "80px", marginRight: "8px" }}
                  />
                  <button
                    className=" btn-secondary"
                    onClick={() => updateGramsSoldHandler(inv.id)}
                    disabled={Number(soldInputs[inv.id]?.grams || 0) <= 0}
                  >
                    Update
                  </button>
                </td>
                <td data-label="btn-secondary">
                  <Link to={`/superadmin/inventory/${inv.id}`} className="btn-secondary">
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
              <button className="btn btn-primary" onClick={addInventoryHandler}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryManager;
