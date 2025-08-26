// src/Layouts/Superadmin.jsx
// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

const SuperadminLayout = () => {

  return (
    <div className="superadmin-layout">
      {/* Navbar */}
      <Navbar />

      

      {/* Main Content */}
      <main className="dashboard-content" style={{ marginTop: "60px", }}>
        <Outlet />
      </main>
    </div>
  );
};

export default SuperadminLayout;
