import { useDispatch, useSelector } from "react-redux";
import { toggleTheme } from "../store/themeSlice";
function ThemeToggle() {
  const dispatch = useDispatch();
  const mode = useSelector(
    (state)=>state.theme.mode
  );

  return(
    <button
      onClick={() =>dispatch(toggleTheme())}
    >
      {mode === "light"
        ?"Dark Mode"
        :"Light Mode"}
    </button>
  );
}
export default ThemeToggle;