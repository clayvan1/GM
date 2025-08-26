// Navbar.jsx
import React, { useState, useEffect } from "react";
import { FiMenu, FiX, FiUser } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import GlassSurface from "./Landing/GlassSurface";
import { useAuth } from "../context/AuthContext"; // assuming your AuthContext file
import "./Navbar.css";

const SidebarPortal = ({ children }) => {
  if (typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => setMenuOpen((v) => !v);
  const closeMenu = () => setMenuOpen(false);

  // Lock body scroll when menu is open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = menuOpen ? "hidden" : prev || "";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // Links based on login status and role
  const renderLinks = () => {
    if (!user) {
      return (
        <>
          <li>
            <Link to="/login" onClick={closeMenu}>Login</Link>
          </li>
          <li>
            <Link to="/signup" onClick={closeMenu}>Sign Up</Link>
          </li>
        </>
      );
    }

    if (user.role === "superadmin") {
      return (
        <>
          <li>
            <Link to="/superadmin" onClick={closeMenu}>Home</Link>
          </li>
          <li>
            <Link to="/superadmin/inventory" onClick={closeMenu}>Inventory</Link>
          </li>
          <li>
            <Link to="/superadmin/users" onClick={closeMenu}>Users</Link>
          </li>
          <li>
            <Link to="/contact" onClick={closeMenu}>Contact</Link>
          </li>
          <li>
            <button onClick={() => { logout(); closeMenu(); }} className="logout-btn">Logout</button>
          </li>
        </>
      );
    }

    if (user.role === "employee") {
      return (
        <>
          <li>
            <Link to="/dashboard" onClick={closeMenu}>Dashboard</Link>
          </li>
          <li>
            <Link to="/assigned-joints" onClick={closeMenu}>My Joints</Link>
          </li>
          <li>
            <Link to="/contact" onClick={closeMenu}>Contact</Link>
          </li>
          <li>
            <button onClick={() => { logout(); closeMenu(); }} className="logout-btn">Logout</button>
          </li>
        </>
      );
    }

    return null;
  };

  return (
    <>
      <div className="navbar-wrapper">
        <GlassSurface
          width="90%"
          height={60}
          borderRadius={50}
          className="navbar-glass"
        >
          <button onClick={toggleMenu} className="navbar-icon">
            {menuOpen ? <FiX /> : <FiMenu />}
          </button>
          <div className="navbar-title">MyApp</div>
          <button className="navbar-icon">
            <FiUser />
          </button>
        </GlassSurface>
      </div>

      {/* Sidebar */}
      <SidebarPortal>
        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="sidebar"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              <ul className="sidebar-links">
                {renderLinks()}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </SidebarPortal>
    </>
  );
}
