import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">PinLearn</div>

      <div className="nav-links">
        <Link to="/dashboard">Home</Link>
        <Link to="/dashboard">Explore</Link>
        <Link to="/boards">My Boards</Link>
        <Link to="/kanban">Kanban</Link>
      </div>

      <div className="search-box">
        <input type="text" placeholder="Search..." />
      </div>

      <button className="profile" onClick={handleLogout}>Log out</button>
    </nav>
  );
}

export default Navbar;