// src/pages/SignupPage.jsx
import React, { useState } from "react";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import GlassSurface from "../components/Landing/GlassSurface";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

const SignupPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const { handleSignup } = useAuth();
  const navigate = useNavigate();

  const togglePassword = () => setShowPassword((prev) => !prev);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const data = await handleSignup(form.username, form.email, form.password);

    if (data.error) {
      setMessage(data.error);
    } else {
      setMessage("Signup successful! Redirecting to login...");
      setTimeout(() => navigate("/login"), 1500);
    }
  };

  return (
    <div className="auth-page">
      <GlassSurface width="400px" height={550} borderRadius={20} className="login-glass">
        <div className="auth-form">
          <h2>Create Account</h2>

          <input
            type="text"
            name="username"
            placeholder="Username"
            className="auth-input"
            value={form.username}
            onChange={handleChange}
          />
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

          <button className="auth-btn" onClick={handleSubmit}>
            Sign Up
          </button>

          {message && <p className="signup-message">{message}</p>}

          <p className="signup-text">
            Already have an account? <a href="/login">Login</a>
          </p>
        </div>
      </GlassSurface>
    </div>
  );
};

export default SignupPage;
