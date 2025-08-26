// src/pages/JointsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./Joint.css";
import { getJoints, createJoint, updateJoint } from "../Service/JointService";
import { getInventories } from "../Service/InventoryService";
import UserService from "../Service/userService";
import { useAuth } from "../context/AuthContext";

const JointsPage = () => {
  const { inventoryId } = useParams();
  const { employeeId } = useAuth();

  const [joints, setJoints] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [inventory, setInventory] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jointCount, setJointCount] = useState("");
  const [gramsUsed, setGramsUsed] = useState("");
  const [pricePerJoint, setPricePerJoint] = useState("");

  const [soldInputs, setSoldInputs] = useState({});
  const [soldPriceInputs, setSoldPriceInputs] = useState({});
  const [assignInputs, setAssignInputs] = useState({});

  // =================== Fetch Inventory ===================
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const invArray = await getInventories();
      const invData = invArray.find(i => i.id === Number(inventoryId));

      if (!invData) {
        setInventory(null);
        setLoading(false);
        return;
      }

      const gramsAvailable = parseFloat(invData.grams_available ?? 0);
      setInventory({ ...invData, grams_available: gramsAvailable });
    } catch (err) {
      setInventory(null);
    } finally {
      setLoading(false);
    }
  };

  // =================== Fetch Joints ===================
  const fetchJoints = async () => {
    try {
      const allJoints = await getJoints();
      const invJoints = allJoints.filter(j => j.inventory_id === Number(inventoryId));
      setJoints(invJoints);
    } catch (err) {
      setJoints([]);
    }
  };

  // =================== Fetch Employees ===================
  const fetchEmployees = async () => {
    try {
      const emps = await UserService.getEmployees();
      setEmployees(emps);
    } catch (err) {
      setEmployees([]);
    }
  };

  useEffect(() => {
    fetchInventory();
    fetchJoints();
    fetchEmployees();
  }, [inventoryId]);

  // =================== Add Joint ===================
  const handleAddJoint = async () => {
    const gramsFloat = parseFloat(gramsUsed) || 0;
    const jointsInt = parseInt(jointCount) || 0;
    const priceFloat = parseFloat(pricePerJoint) || 0;

    if (!jointsInt || !gramsFloat || !priceFloat) {
      alert("Please fill all fields correctly.");
      return;
    }

    const availableGrams = parseFloat(inventory?.grams_available || 0);
    if (!inventory || availableGrams < gramsFloat) {
      alert("Not enough grams in inventory!");
      return;
    }

    const payload = {
      inventory_id: Number(inventoryId),
      joints_count: jointsInt,
      grams_used: gramsFloat,
      price_per_joint: priceFloat,
      assigned_to: null,
      sold_price: 0.0
    };

    try {
      await createJoint(payload);
      await fetchInventory();
      await fetchJoints();

      setIsModalOpen(false);
      setJointCount("");
      setGramsUsed("");
      setPricePerJoint("");
    } catch (err) {
      alert("Failed to create joint.");
    }
  };

  // =================== Sell Blunts ===================
  const sellBlunts = async (jointId) => {
    const toSell = Math.floor(Number(soldInputs[jointId] || 0));
    const soldPrice = parseFloat(soldPriceInputs[jointId] || 0);

    if (toSell <= 0 || soldPrice <= 0) return;

    const payload = { sold_qty: toSell, sold_price: soldPrice, sold_by: employeeId };
    try {
      await updateJoint(jointId, payload);
      await fetchJoints();
      await fetchInventory();

      setSoldInputs(prev => ({ ...prev, [jointId]: "" }));
      setSoldPriceInputs(prev => ({ ...prev, [jointId]: "" }));
    } catch (err) {}
  };

  // =================== Assign Employee ===================
  const assignEmployee = async (jointId, employeeIdToAssign) => {
    if (!employeeIdToAssign) {
      alert("Please select an employee to assign");
      return;
    }

    const payload = { assigned_to: employeeIdToAssign };
    try {
      const updated = await updateJoint(jointId, payload);
      setJoints(prev => prev.map(j => (j.id === jointId ? updated.joint || updated : j)));
      setAssignInputs(prev => ({ ...prev, [jointId]: "" }));
    } catch (err) {}
  };

  // =================== Totals ===================
  const totalJoints = joints.reduce((sum, j) => sum + (j.joints_count || 0), 0);
  const totalValue = joints.reduce((sum, j) => sum + (j.joints_count || 0) * (j.price_per_joint || 0), 0);
  const totalCashSold = joints.reduce((sum, j) => sum + (j.sold_price || 0), 0);
  const gramsRemaining = inventory?.grams_available || 0;

  if (loading) return <div className="joints-container">Loading joints...</div>;

  return (
    <div className="joints-container">
      <div className="header-row">
        <h1>🌿 Joint Inventory #{inventoryId}</h1>
        <Link to="/superadmin/inventory" className="back-btn">← Back to Inventory</Link>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-value">{totalJoints}</div>
          <div className="card-label">Total Joints</div>
        </div>
        <div className="summary-card">
          <div className="card-value">{gramsRemaining}g</div>
          <div className="card-label">Grams Remaining</div>
        </div>
        <div className="summary-card">
          <div className="card-value">Ksh {totalValue}</div>
          <div className="card-label">Total Inventory Value</div>
        </div>
        <div className="summary-card">
          <div className="card-value">Ksh {totalCashSold}</div>
          <div className="card-label">Total Cash Sold</div>
        </div>
      </div>

      <button className="btn-primary add-joint-btn" onClick={() => setIsModalOpen(true)}>➕ Add New Joint</button>

      <div className="table-wrapper">
        <table className="joints-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Joint Count</th>
              <th>Grams Used</th>
              <th>Price per Joint</th>
              <th>Total Value</th>
              <th>Blunts Sold</th>
              <th>Sold Price</th>
              <th>Sold By</th>
              <th>Assigned Employee</th>
            </tr>
          </thead>
          <tbody>
            {joints.length ? (
              joints.map(j => (
                <tr key={j.id}>
                  <td>{j.id}</td>
                  <td>{j.joints_count}</td>
                  <td>{j.grams_used}g</td>
                  <td>Ksh {j.price_per_joint}</td>
                  <td>Ksh {(j.joints_count || 0) * (j.price_per_joint || 0)}</td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      placeholder="Qty"
                      value={soldInputs[j.id] || ""}
                      onChange={e => setSoldInputs(prev => ({ ...prev, [j.id]: e.target.value }))}
                      disabled={j.joints_count === 0}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="1"
                      step="0.1"
                      placeholder="Price"
                      value={soldPriceInputs[j.id] || ""}
                      onChange={e => setSoldPriceInputs(prev => ({ ...prev, [j.id]: e.target.value }))}
                      disabled={j.joints_count === 0}
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={() => sellBlunts(j.id)}
                      disabled={j.joints_count === 0}
                    >
                      Sell
                    </button>
                  </td>
                  <td>{employees.find(e => e.id === Number(j.sold_by))?.username || "-"}</td>
                  <td>
                    <select
                      value={assignInputs[j.id] || j.assigned_to || ""}
                      onChange={e => setAssignInputs(prev => ({ ...prev, [j.id]: e.target.value }))}
                    >
                      <option value="">-- Assign --</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.username}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-secondary"
                      onClick={() => assignEmployee(j.id, assignInputs[j.id] || j.assigned_to)}
                    >
                      Assign
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="9" className="no-data">No joints available.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2>Add New Joint</h2>
            <div className="input-group">
              <label>Joint Count</label>
              <input type="number" value={jointCount} onChange={e => setJointCount(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Grams Used</label>
              <input type="number" step="0.1" value={gramsUsed} onChange={e => setGramsUsed(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Price per Joint (Ksh)</label>
              <input type="number" value={pricePerJoint} onChange={e => setPricePerJoint(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddJoint}>Save Joint</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JointsPage;
