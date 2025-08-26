// src/context/AuthContext.jsx
import { createContext, useContext, useState } from "react";
import { login, signup } from "../Service/auth";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const storedToken = localStorage.getItem("token");
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const storedEmployeeId = localStorage.getItem("employeeId");

  const [user, setUser] = useState(storedUser || null);
  const [token, setToken] = useState(storedToken || null);
  const [employeeId, setEmployeeId] = useState(storedEmployeeId || null);

  const handleLogin = async (email, password) => {
    const data = await login({ email, password });

    if (!data.error) {
      setUser(data.user); // should include role + id
      setToken(data.access_token);

      localStorage.setItem("token", data.access_token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // ✅ store employeeId if present
      if (data.user?.id) {
        localStorage.setItem("employeeId", data.user.id);
        setEmployeeId(data.user.id);
        console.log("✅ Stored employeeId:", data.user.id);
      } else {
        console.warn("⚠️ No employeeId found in login response:", data.user);
      }
    }

    return data;
  };

  const handleSignup = async (username, email, password) => {
    return await signup({ username, email, password });
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setEmployeeId(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    localStorage.removeItem("employeeId");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        employeeId,
        handleLogin,
        handleSignup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
