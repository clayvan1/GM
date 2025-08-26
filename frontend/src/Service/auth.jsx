const API_BASE = import.meta.env.VITE_API_BASE;

export async function signup({ username, email, password }) {
  const res = await fetch(`${API_BASE}/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  return res.json();
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
  return res.json();
}
