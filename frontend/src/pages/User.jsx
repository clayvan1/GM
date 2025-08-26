// src/pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import UserService from "../Service/userService";
import "./UsersPage.css";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdates, setRoleUpdates] = useState({});

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UserService.getAllUsers(); // fetch all users
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle dropdown change locally
  const handleRoleChange = (userId, role) => {
    setRoleUpdates(prev => ({ ...prev, [userId]: role }));
  };

  // Update role in DB
  const updateRole = async (userId) => {
    const role = roleUpdates[userId];
    if (role === undefined || role === null) return;

    try {
      const updated = await UserService.updateUserRole(userId, role);
      const updatedUser = updated.user || { ...users.find(u => u.id === userId), role };
      setUsers(prev =>
        prev.map(u => (u.id === userId ? updatedUser : u))
      );
      setRoleUpdates(prev => ({ ...prev, [userId]: undefined }));
    } catch (err) {
      console.error("Failed to update role:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) return <div className="users-container">Loading users...</div>;

  return (
    <div className="users-container">
      <h1>👥 User Management</h1>
      <div className="table-wrapper">
        <table className="users-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Username</th>
              <th>Email</th>
              <th>Current Role</th>
              <th>Update Role</th>
            </tr>
          </thead>
          <tbody>
            {users.length ? (
              users.map(user => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role || "-"}</td>
                  <td className="role-cell">
                    <select
                      value={roleUpdates[user.id] ?? user.role ?? ""}
                      onChange={e => handleRoleChange(user.id, e.target.value)}
                    >
                      <option value="">No Role</option>
                      <option value="employee">Employee</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    <button
                      className="btn-primary"
                      onClick={() => updateRole(user.id)}
                    >
                      Update
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UsersPage;
