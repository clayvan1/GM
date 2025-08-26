// src/components/Sidebar/Sidebar.jsx
import React from "react";
import "./Sidebar.css";

const Sidebar = ({ isOpen, toggleSidebar }) => {
  return (
    <div className={`sidebar ${isOpen ? "open" : ""}`}>
      <ul>
        <li>Dashboard</li>
        <li>Manage Employees</li>
        <li>Reports</li>
        <li>Settings</li>
        <li onClick={toggleSidebar}>Close Sidebar</li>
      </ul>
    </div>
  );
};

export default Sidebar;
