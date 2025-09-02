import React from "react";
import GlassSurface from "../components/Landing/GlassSurface";
import Ballpit from '../components/Landing/Ballpit';
import './LandingPage.css';
import CircularText from "../components/Landing/CircularText";
import { Link } from "react-router-dom";
const LandingPage = () => {
  return (
    <div className="landing-container">
      
      {/* Prism Background */}
      <div className="prism-background">
        <Ballpit
          count={80}
          gravity={0.01}
          friction={0.9975}
          wallBounce={0.95}
          followCursor={true}
          colors={[0x8B4513, 0xC0392B, 0xE67E22, 0x228B22]}
        />
      </div>

      {/* GlassSurface Navbar */}
      <GlassSurface 
        width="80%" 
        height={70} 
        borderRadius={100} 
        className="navbar"
      >
        <div className="navbar-content">
          <h2>entrapreneur</h2>
          <nav>
              <Link to="/login">Login</Link>
          </nav>
        </div>
      </GlassSurface>

      {/* Centered Content */}
      <div className="landing-content">
        <h1>Welcome to entrap</h1>
        <p>Trillest</p>
        <Link to="/signup" className="get-started-btn">Get Started</Link>
        <CircularText
  text="RESPECT*THE*GAME*"
  onHover="speedUp"
  spinDuration={20}
  className="custom-class"
/>
      </div>

    </div>
  );
}

export default LandingPage;
