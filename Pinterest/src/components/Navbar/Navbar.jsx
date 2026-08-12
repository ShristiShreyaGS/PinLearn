import { Link } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  return (
    <nav className="navbar">
      <div className="logo">PinLearn</div>

      <div className="nav-links">
        <Link to="/dashboard">Home</Link>
        <Link to="/dashboard">Explore</Link>
        <Link to="/boards">My Boards</Link>
      </div>

      <div className="search-box">
        <input type="text" placeholder="Search..." />
      </div>

      <div className="profile">Profile</div>
    </nav>
  );
}

export default Navbar;