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
    <nav className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="text-[23px] font-extrabold tracking-tight text-[#0b1736] dark:text-white">PinLearn</div>
        </div>

        <div className="hidden sm:flex sm:items-center sm:gap-6 md:gap-8 lg:gap-10 text-sm font-semibold overflow-x-auto">
          <Link to="/dashboard" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Home</Link>
          <Link to="/quiz" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Daily Quiz</Link>
          <Link to="/boards" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">My Boards</Link>
          <Link to="/kanban" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Kanban</Link>
          <Link to="/profile" className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white">Profile</Link>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0b1736] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" onClick={handleLogout}>Log out</button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;