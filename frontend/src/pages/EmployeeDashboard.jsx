// src/pages/EmployeeDashboard.jsx
import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getJoints, updateJoint } from "../Service/JointService";  

import "./EmployeeJointsPage.css";

const EmployeeDashboard = () => {
  const { employeeId } = useAuth();
  const [joints, setJoints] = useState([]);
  const [sales, setSales] = useState({});
  const [dailySales, setDailySales] = useState({ totalSold: 0, totalValue: 0 });

  // Load daily sales from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("dailySales")) || {};
    if (saved.date === new Date().toDateString()) {
      setDailySales(saved.data);
    }
  }, []);

  // Save daily sales to localStorage whenever it changes
  useEffect(() => {
    const save = {
      date: new Date().toDateString(),
      data: dailySales,
    };
    localStorage.setItem("dailySales", JSON.stringify(save));
  }, [dailySales]);

  // Fetch joints assigned to the employee
  useEffect(() => {
    const fetchEmployeeJoints = async () => {
      try {
        const allJoints = await getJoints(); // array of joints
        const filtered = allJoints.filter(
          j => String(j.assigned_to) === String(employeeId) && j.joints_count > 0
        );
        setJoints(filtered);

        // initialize sales state
        const initialSales = {};
        filtered.forEach(j => {
          initialSales[j.id] = { soldPrice: "", bluntsSold: "" };
        });
        setSales(initialSales);
      } catch (error) {
        console.error("❌ Error fetching employee joints:", error);
      }
    };

    if (employeeId) fetchEmployeeJoints();
  }, [employeeId]);

  // Handle input changes
  const handleSaleChange = (jointId, field, value) => {
    if (value < 0) return;
    setSales(prev => ({
      ...prev,
      [jointId]: { ...prev[jointId], [field]: value }
    }));
  };

  // Sell blunts
  const sellBlunts = async (joint) => {
    const entry = sales[joint.id] || {};
    const bluntsSold = parseInt(entry.bluntsSold) || 0;
    const soldPrice = parseFloat(entry.soldPrice) || 0;

    if (bluntsSold <= 0 || soldPrice <= 0) {
      alert("⚠️ Please enter valid values for sale.");
      return;
    }
    if (bluntsSold > joint.joints_count) {
      alert(`⚠️ Cannot sell more blunts than available (${joint.joints_count}).`);
      return;
    }

    const newCount = joint.joints_count - bluntsSold;
    const updatedSoldPrice = (joint.sold_price || 0) + soldPrice * bluntsSold;

    try {
      const updated = await updateJoint(joint.id, {
        joints_count: newCount,
        sold_price: updatedSoldPrice,
        sold_qty: bluntsSold,
        sold_by: employeeId
      });

      setJoints(prev =>
        prev.map(j => j.id === joint.id ? (updated.joint || updated) : j)
            .filter(j => j.joints_count > 0)
      );

      // Update daily sales
      setDailySales(prev => ({
        totalSold: prev.totalSold + bluntsSold,
        totalValue: prev.totalValue + soldPrice * bluntsSold,
      }));

      // Clear inputs
      setSales(prev => ({
        ...prev,
        [joint.id]: { soldPrice: "", bluntsSold: "" },
      }));
    } catch (err) {
      console.error("❌ Failed to sell blunts:", err);
    }
  };

  return (
    <div className="employee-container">
      <h1>Employee Dashboard</h1>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="card highlight">
          <h3>Sales Today</h3>
          <p>{dailySales.totalSold} blunts</p>
          <p>KES {dailySales.totalValue}</p>
        </div>
      </div>

      {/* Joints Table */}
      <div className="table-wrapper">
        <table className="employee-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Strain</th>
              <th>Joints Available</th>
              <th>Grams Used</th>
              <th>Price/Joint</th>
              <th>Sold Price</th>
              <th>Blunts Sold</th>
              <th>Sell</th>
            </tr>
          </thead>
          <tbody>
            {joints.length > 0 ? (
              joints.map(joint => {
                const entry = sales[joint.id] || {};
                const bluntsSold = parseInt(entry.bluntsSold) || 0;
                const jointsRemaining = Math.max((joint.joints_count || 0) - bluntsSold, 0);

                return (
                  <tr key={joint.id}>
                    <td>{joint.id}</td>
                    <td>{joint.inventory?.strain_name || "N/A"}</td>
                    <td>{jointsRemaining}</td>
                    <td>{joint.grams_used}</td>
                    <td>KES {joint.price_per_joint}</td>
                    <td>
                      <input
                        type="number"
                        value={entry.soldPrice || ""}
                        onChange={e => handleSaleChange(joint.id, "soldPrice", e.target.value)}
                        placeholder="KES"
                        className="input-cell"
                        min="1"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={entry.bluntsSold || ""}
                        onChange={e => handleSaleChange(joint.id, "bluntsSold", e.target.value)}
                        placeholder="# sold"
                        className="input-cell"
                        min="1"
                        max={joint.joints_count}
                      />
                    </td>
                    <td>
                      <button
                        className="sell-btn"
                        onClick={() => sellBlunts(joint)}
                        disabled={bluntsSold > joint.joints_count || bluntsSold <= 0}
                      >
                        Sell
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="8" style={{ textAlign: "center" }}>
                  No joints available.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
