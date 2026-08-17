import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { clearSession } from "../../api/user";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="logo">PinLearn</div>

      <div className="nav-links">
        <Link to="/dashboard">Home</Link>
        <Link to="/boards">My Boards</Link>
        <Link to="/kanban">Kanban</Link>
        <Link to="/profile">Profile</Link>
      </div>

      {/* <div className="search-box">
        <input type="text" placeholder="Search..." />
      </div> */}

      <button className="profile" onClick={handleLogout}>Log out</button>
    </nav>
  );
}

export default Navbar;