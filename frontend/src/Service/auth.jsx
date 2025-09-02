import UserService from "./userService";

const API_BASE = import.meta.env.VITE_API_BASE;

export async function signup({ username, email, password }) {
  const res = await fetch(`${API_BASE}/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  const data = await res.json();

  if (res.ok) {
    // Refresh cached users after successful signup
    await UserService.getAllUsers(true);      // force refresh all users
    await UserService.getEmployees(true);     // refresh employees cache
  }

  return data;
}

export async function login({ email, password }) {
  const res = await fetch(`${API_BASE}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function updateUserRole(userId, role, token) {
  const res = await fetch(`${API_BASE}/api/users/${userId}/role`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ role }),
  });
  const data = await res.json();

  if (res.ok) {
    // Refresh users cache after role update
    await UserService.getAllUsers(true);
    await UserService.getEmployees(true);
  }

  return data;
}
