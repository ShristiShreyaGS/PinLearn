import { Link, useNavigate } from "react-router-dom";
import "./Navbar.css";
import { clearSession } from "../../api/user";
import ThemeToggle from "../ThemeToggle";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <nav className="navbar bg-white dark:bg-slate-900 dark:border-slate-700">
      
      <div className="logo text-slate-900 dark:text-white">PinLearn</div>

      <div className="nav-links">
        <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Home</Link>
        <Link to="/boards" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">My Boards</Link>
        <Link to="/kanban" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Kanban</Link>
        <Link to="/profile" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Profile</Link>
                <div><ThemeToggle/></div>
        
      </div>

      {/* <div className="search-box">
        <input type="text" placeholder="Search..." />
      </div> */}

      <button className="profile bg-white dark:bg-slate-800 text-slate-900 dark:text-white border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700" onClick={handleLogout}>Log out</button>
    </nav>
  );
}

export default Navbar;