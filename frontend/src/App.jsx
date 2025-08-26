// src/App.jsx
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// Pages
import LandingPage from "./pages/Landing";
import LoginPage from "./pages/Login";
import SignupPage from "./pages/Signup";
import EmployeeJointsPage from "./pages/EmployeeDashboard";
import SuperadminDashboard from "./pages/SuperadminDashboard";
import InventoryManager from "./pages/Inventory";
import JointsPage from "./pages/JointsPage";
import UsersPage from "./pages/User";
// Layouts
import SuperadminLayout from "./Layouts/Superadmin";
import EmployeeLayout from "./Layouts/Employee";

// Context
import { AuthProvider } from "./context/AuthContext";

// Role-based route
import RoleRoute from "./components/RoleRoute";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Employee Dashboard with Layout */}
          <Route
            path="/employee"
            element={
              <RoleRoute allowedRoles={["employee"]}>
                <EmployeeLayout />
              </RoleRoute>
            }
          >
            {/* Default dashboard page */}
            <Route index element={<EmployeeJointsPage />} />

            {/* Add sub-pages inside employee layout */}
            <Route path="profile" element={<h2>Employee Profile</h2>} />
            <Route path="tasks" element={<h2>Task Management</h2>} />
          </Route>

          {/* Superadmin Dashboard with Layout */}
          <Route
            path="/superadmin"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <SuperadminLayout />
              </RoleRoute>
            }
          >
            {/* Default dashboard page */}
            <Route index element={<SuperadminDashboard />} />

            {/* Add sub-pages inside superadmin layout */}
           <Route path="inventory">
  <Route index element={<InventoryManager />} />
    <Route path=":inventoryId" element={<JointsPage />} />
</Route>

            <Route path="users" element={<UsersPage />} />
            <Route path="settings" element={<h2>System Settings</h2>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
