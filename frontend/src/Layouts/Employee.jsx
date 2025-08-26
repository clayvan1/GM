// src/Layouts/Employee.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const EmployeeLayout = () => {
  
  return (
    <div className="employee-layout">
      {/* Navbar */}
      <Navbar />

    

      {/* Main Content */}
      <main className="dashboard-content" style={{ marginTop: "60px", padding: "1rem" }}>
        <Outlet />
      </main>
    </div>
  );
};

export default EmployeeLayout;
