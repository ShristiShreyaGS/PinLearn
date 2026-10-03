import { useState } from "react";
import { Link } from "react-router-dom";
import { clearSession } from "../../api/user";
import ThemeToggle from "../ThemeToggle";

const NAV_LINKS = [
  { to: "/dashboard", label: "Home" },
  { to: "/quiz", label: "Daily Quiz" },
  { to: "/boards", label: "My Boards" },
  { to: "/kanban", label: "Kanban" },
  { to: "/profile", label: "Profile" }
];

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogout = () => {
    clearSession();
    window.location.href = "/";
  };

  return (
    <nav className="sticky top-0 z-20 w-full border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-8">
        <div className="flex items-center gap-4">
          <div className="text-lg font-extrabold tracking-tight text-[#0b1736] dark:text-white sm:text-[23px]">PinLearn</div>
        </div>

        <div className="hidden sm:flex sm:flex-wrap sm:items-center sm:gap-4 md:gap-8 lg:gap-10 text-sm font-semibold">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          <button className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0b1736] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700" onClick={handleLogout}>Log out</button>
          <button
            type="button"
            onClick={() => setIsMenuOpen((open) => !open)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-[#0b1736] transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700 sm:hidden"
          >
            <span aria-hidden="true">{isMenuOpen ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="border-t border-slate-200 bg-white px-4 py-3 dark:border-slate-800 dark:bg-slate-900 sm:hidden">
          <div className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setIsMenuOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {link.label}
              </Link>
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