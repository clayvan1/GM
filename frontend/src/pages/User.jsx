// src/pages/UsersPage.jsx
import React, { useEffect, useState } from "react";
import UserService from "../Service/userService"; // Corrected path assuming 'Service' is the folder
import "./UsersPage.css";

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleUpdates, setRoleUpdates] = useState({});
  const [updatingId, setUpdatingId] = useState(null); // Tracks which user is currently being updated

  // Fetch or refetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await UserService.getAllUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Error fetching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Handle dropdown change locally
  const handleRoleChange = (userId, role) => {
    setRoleUpdates((prev) => ({ ...prev, [userId]: role }));
  };

  // --- THIS FUNCTION IS UPDATED ---
  // Update role in DB and then refetch the entire list
  const updateRole = async (userId) => {
    const role = roleUpdates[userId];
    if (role === undefined) return; // Only update if a new role was selected

    setUpdatingId(userId); // Disable button for this user
    try {
      // 1. Update the role in the database (this will clear the cache)
      await UserService.updateUserRole(userId, role);

      // 2. Refetch all users to get the fresh data
      await fetchUsers();

      // 3. Clear the pending role change for this user
      setRoleUpdates((prev) => {
        const newUpdates = { ...prev };
        delete newUpdates[userId];
        return newUpdates;
      });

    } catch (err) {
      console.error("Failed to update role:", err);
      // Optionally, show an error message to the user
    } finally {
      setUpdatingId(null); // Re-enable button
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
              users.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{user.role || "-"}</td>
                  <td className="role-cell">
                    <select
                      value={roleUpdates[user.id] ?? user.role ?? ""}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      disabled={updatingId === user.id} // Disable during update
                    >
                      <option value="">No Role</option>
                      <option value="employee">Employee</option>
                      <option value="superadmin">Superadmin</option>
                    </select>
                    <button
                      className="btn-primary"
                      onClick={() => updateRole(user.id)}
                      disabled={updatingId === user.id || roleUpdates[user.id] === undefined} // Disable during update or if no change
                    >
                      {updatingId === user.id ? "Saving..." : "Update"}
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