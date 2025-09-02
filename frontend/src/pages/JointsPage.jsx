// src/pages/JointsPage.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import "./Joint.css";
import {
  getJoints,
  createJoint,
  updateJoint,
  deleteJoint,
} from "../Service/JointService";
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

  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [jointCount, setJointCount] = useState("");
  const [gramsUsed, setGramsUsed] = useState("");
  const [pricePerJoint, setPricePerJoint] = useState("");

  // Inputs per joint row
  const [soldInputs, setSoldInputs] = useState({});
  const [soldPriceInputs, setSoldPriceInputs] = useState({});
  const [assignInputs, setAssignInputs] = useState({});

  // Button loading states
  const [buttonLoading, setButtonLoading] = useState({});

  // =================== Fetch Inventory ===================
  const fetchInventory = async () => {
    try {
      setLoading(true);
      const invArray = await getInventories();
      const invData = invArray.find((i) => i.id === Number(inventoryId));
      setInventory(invData || null);
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
      const invJoints = allJoints.filter(
        (j) => j.inventory_id === Number(inventoryId)
      );
      setJoints(invJoints);
    } catch (err) {
      setJoints([]);
    }
  };

  // =================== Fetch Employees ===================
  const fetchEmployees = async () => {
    try {
      const allUsers = await UserService.getAllUsers();
      setEmployees(allUsers.filter((u) => u.role === "employee"));
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

    if (jointsInt <= 0 || gramsFloat <= 0 || priceFloat <= 0) {
      alert("All values must be greater than zero.");
      return;
    }

    if (!inventory || inventory.grams_available < gramsFloat) {
      alert("Not enough grams in inventory!");
      return;
    }

    const payload = {
      inventory_id: Number(inventoryId),
      joints_count: jointsInt,
      grams_used: gramsFloat,
      price_per_joint: priceFloat,
      assigned_to: null,
      sold_price: 0,
    };

    try {
      setButtonLoading((prev) => ({ ...prev, addJoint: true }));
      await createJoint(payload);
      await fetchInventory();
      await fetchJoints();
      setIsModalOpen(false);
      setJointCount("");
      setGramsUsed("");
      setPricePerJoint("");
    } catch {
      alert("Failed to create joint.");
    } finally {
      setButtonLoading((prev) => ({ ...prev, addJoint: false }));
    }
  };

  // =================== Sell Blunts ===================
  const sellBlunts = async (jointId) => {
    const joint = joints.find((j) => j.id === jointId);
    const toSell = Math.floor(Number(soldInputs[jointId] || 0));
    const soldPrice = parseFloat(soldPriceInputs[jointId] || 0);

    if (toSell <= 0) return;
    if (toSell > (joint.joints_count || 0)) {
      alert(`Cannot sell more than ${joint.joints_count} joints.`);
      return;
    }

    const payload = {
      sold_qty: toSell,
      sold_price: soldPrice,
      sold_by: employeeId,
    };

    try {
      setButtonLoading((prev) => ({ ...prev, [`sell-${jointId}`]: true }));
      await updateJoint(jointId, payload);
      // REFRESH joints and inventory after sale
      await fetchJoints();
      await fetchInventory();
      setSoldInputs((prev) => ({ ...prev, [jointId]: "" }));
      setSoldPriceInputs((prev) => ({ ...prev, [jointId]: "" }));
    } catch {
      alert("Failed to sell joints.");
    } finally {
      setButtonLoading((prev) => ({ ...prev, [`sell-${jointId}`]: false }));
    }
  };

  // =================== Assign Employee ===================
  const assignEmployee = async (jointId, employeeIdToAssign) => {
    if (!employeeIdToAssign) {
      alert("Please select an employee to assign");
      return;
    }

    const payload = { assigned_to: employeeIdToAssign };
    try {
      setButtonLoading((prev) => ({ ...prev, [`assign-${jointId}`]: true }));
      await updateJoint(jointId, payload);
      await fetchJoints();
      setAssignInputs((prev) => ({ ...prev, [jointId]: "" }));
    } catch {
      alert("Failed to assign employee.");
    } finally {
      setButtonLoading((prev) => ({ ...prev, [`assign-${jointId}`]: false }));
    }
  };

  // =================== Delete Joint ===================
  const handleDeleteJoint = async (jointId) => {
    try {
      setButtonLoading((prev) => ({ ...prev, [`delete-${jointId}`]: true }));
      await deleteJoint(jointId);
      await fetchJoints();
      await fetchInventory();
    } catch {
      alert("Failed to delete joint.");
    } finally {
      setButtonLoading((prev) => ({ ...prev, [`delete-${jointId}`]: false }));
    }
  };

  // =================== Totals ===================
  const totalJoints = joints.reduce((sum, j) => sum + (j.joints_count || 0), 0);
  const totalValue = joints.reduce(
    (sum, j) => sum + (j.joints_count || 0) * (j.price_per_joint || 0),
    0
  );
  const totalCashSold = joints.reduce((sum, j) => sum + (j.sold_price || 0), 0);
  const gramsRemaining = inventory?.grams_available || 0;

  if (loading) return <div className="joints-container">Loading joints...</div>;

  return (
    <div className="joints-container">
      <div className="header-row">
        <h1>🌿 Joint Inventory #{inventoryId}</h1>
        <Link to="/superadmin/inventory" className="back-btn">
          ← Back to Inventory
        </Link>
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

      <button
        className="btn-primary add-joint-btn"
        onClick={() => setIsModalOpen(true)}
      >
        ➕ Add New Joint
      </button>

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
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {joints.length ? (
              joints.map((j) => (
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
                      onChange={(e) =>
                        setSoldInputs((prev) => ({ ...prev, [j.id]: e.target.value }))
                      }
                      disabled={j.joints_count === 0}
                    />
                  </td>
                  <td>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="Price"
                      value={soldPriceInputs[j.id] || ""}
                      onChange={(e) =>
                        setSoldPriceInputs((prev) => ({ ...prev, [j.id]: e.target.value }))
                      }
                      disabled={j.joints_count === 0}
                    />
                    <button
                      className="btn btn-secondary"
                      onClick={() => sellBlunts(j.id)}
                      disabled={j.joints_count === 0 || buttonLoading[`sell-${j.id}`]}
                    >
                      {buttonLoading[`sell-${j.id}`] ? "⏳ Selling..." : "Sell"}
                    </button>
                  </td>
                  <td>
                    {employees.find((e) => e.id === Number(j.sold_by))?.username || "-"}
                  </td>
                  <td>
                    <select
                      value={assignInputs[j.id] || j.assigned_to || ""}
                      onChange={(e) =>
                        setAssignInputs((prev) => ({ ...prev, [j.id]: e.target.value }))
                      }
                    >
                      <option value="">-- Assign --</option>
                      {employees.map((emp) => (
                        <option key={emp.id} value={emp.id}>{emp.username}</option>
                      ))}
                    </select>
                    <button
                      className="btn btn-secondary"
                      onClick={() => assignEmployee(j.id, assignInputs[j.id] || j.assigned_to)}
                      disabled={buttonLoading[`assign-${j.id}`]}
                    >
                      {buttonLoading[`assign-${j.id}`] ? "⏳ Assigning..." : "Assign"}
                    </button>
                  </td>
                  <td>
                    <button
                      className="btn btn-danger"
                      onClick={() => handleDeleteJoint(j.id)}
                      disabled={buttonLoading[`delete-${j.id}`]}
                    >
                      {buttonLoading[`delete-${j.id}`] ? "⏳ Deleting..." : "🗑 Delete"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="10" className="no-data">No joints available.</td>
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
              <input type="number" value={jointCount} onChange={(e) => setJointCount(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Grams Used</label>
              <input type="number" step="0.1" value={gramsUsed} onChange={(e) => setGramsUsed(e.target.value)} />
            </div>
            <div className="input-group">
              <label>Price per Joint (Ksh)</label>
              <input type="number" value={pricePerJoint} onChange={(e) => setPricePerJoint(e.target.value)} />
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddJoint} disabled={buttonLoading.addJoint}>
                {buttonLoading.addJoint ? "⏳ Saving..." : "Save Joint"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JointsPage;
