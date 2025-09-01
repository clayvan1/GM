// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import GlassSurface from "../components/Landing/GlassSurface";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ email: "", password: "" });
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false); // Added loading state
  const { handleLogin } = useAuth();
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true); // Start spinner
    setMessage(""); // Clear previous messages

    try {
      const data = await handleLogin(form.email, form.password);

      if (data.error) {
        setMessage(data.error);
      } else {
        // Redirect based on role
        if (data.user.role === "superadmin") navigate("/superadmin");
        else if (data.user.role === "employee") navigate("/employee");
        else navigate("/"); // fallback
      }
    // eslint-disable-next-line no-unused-vars
    } catch (error) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false); // Stop spinner
    }
  };

  return (
    <div className="auth-page">
      <GlassSurface width="400px" height={400} borderRadius={20} className="login-glass">
        <div className="auth-form">
          <h2>Welcome Back</h2>

          <input
            type="email"
            name="email"
            placeholder="Email"
            className="auth-input"
            value={form.email}
            onChange={handleChange}
          />

          <div className="input-with-icon">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              className="auth-input password-input"
              value={form.password}
              onChange={handleChange}
            />
            <span className="icon" onClick={togglePassword}>
              {showPassword ? <AiFillEyeInvisible /> : <AiFillEye />}
            </span>
          </div>

          <button className="auth-btn" onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <div className="spinner"></div> // Show spinner while loading
            ) : (
              "Login"
            )}
          </button>

          {message && <p className="login-message">{message}</p>}

          <p className="signup-text">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </div>
      </GlassSurface>
    </div>
  );
};

export default LoginPage;
