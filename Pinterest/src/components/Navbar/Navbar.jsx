import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { clearSession } from "../../api/user";
import ThemeToggle from "../ThemeToggle";

const NAV_LINKS = [
  { to: "/dashboard", label: "Home" },
  { to: "/quiz", label: "Daily Quiz" },
  { to: "/boards", label: "My Boards" },
  { to: "/kanban", label: "Kanban" },
  { to: "/profile", label: "Profile" }
];

const desktopLink = ({ isActive }) =>
  `relative py-1 transition ${
    isActive
      ? "text-[#0b1736] after:absolute after:inset-x-0 after:-bottom-[15px] after:h-0.5 after:rounded-full after:bg-[#1e3a8a] dark:text-white dark:after:bg-blue-400"
      : "text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
  }`;

const mobileLink = ({ isActive }) =>
  `rounded-lg px-3 py-2.5 text-sm font-semibold ${
    isActive
      ? "bg-blue-50 text-[#0b1736] dark:bg-slate-800 dark:text-white"
      : "text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
  }`;

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const onKeyDown = (event) => event.key === "Escape" && setIsMenuOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isMenuOpen]);

  const handleLogout = () => {
    clearSession();
    navigate("/", { replace: true });
  };

  return (
    <nav
      aria-label="Primary"
      className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <Link
          to="/dashboard"
          className="text-lg font-extrabold tracking-tight text-[#0b1736] dark:text-white sm:text-[23px]"
        >
          PinLearn
        </Link>

        <div className="hidden text-sm font-semibold sm:flex sm:flex-wrap sm:items-center sm:gap-4 md:gap-8 lg:gap-10">
          {NAV_LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} className={desktopLink}>
              {link.label}
            </NavLink>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0b1736] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
          >
            Log out
          </button>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-controls="mobile-menu"
            aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-300 bg-white text-[#0b1736] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 sm:hidden"
          >
            <span aria-hidden="true">{isMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div
          id="mobile-menu"
          className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:hidden"
        >
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} className={mobileLink}>
                {link.label}
              </NavLink>
            ))}
            <div className="mt-1 px-3">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
