import { Link, useNavigate } from "react-router-dom";
import { clearSession } from "../../api/user";
import ThemeToggle from "../ThemeToggle";

function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearSession();
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-20 flex min-h-[72px] w-full flex-wrap items-center gap-5 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95 sm:px-8">
      
      <div className="text-[23px] font-extrabold tracking-tight text-[#0b1736] dark:text-white">PinLearn</div>

      <div className="order-3 flex w-full items-center gap-5 overflow-x-auto pb-1 text-sm font-semibold sm:order-none sm:w-auto sm:pb-0">
        <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Home</Link>
        <Link to="/quiz" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Daily Quiz</Link>
        <Link to="/boards" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">My Boards</Link>
        <Link to="/kanban" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Kanban</Link>
        <Link to="/profile" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Profile</Link>
                <div><ThemeToggle/></div>
        
      </div>

      {/* <div className="search-box">
        <input type="text" placeholder="Search..." />
      </div> */}

      <button className="ml-auto rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0b1736] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" onClick={handleLogout}>Log out</button>
    </nav>
  );
}

export default Navbar;