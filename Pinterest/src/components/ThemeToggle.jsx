import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../store/themeSlice";
function ThemeToggle() {
  const dispatch = useDispatch();
  const mode = useSelector(
    (state)=>state.theme.mode
  );

  return(
    <button
      type="button"
      onClick={() =>dispatch(toggleTheme())}
      aria-label={mode === "light" ? "Switch to dark mode" : "Switch to light mode"}
      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-[#0b1736] shadow-sm transition hover:-translate-y-0.5 hover:bg-slate-50 hover:shadow dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700"
    >
      <span aria-hidden="true">{mode === "light" ? "🌙" : "☀️"}</span>
      {mode === "light"
        ?"Dark Mode"
        :"Light Mode"}
    </button>
  );
}
export default ThemeToggle;