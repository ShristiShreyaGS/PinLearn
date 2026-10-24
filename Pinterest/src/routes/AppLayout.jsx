import { Outlet, useOutletContext } from "react-router-dom";
import Navbar from "../components/Navbar/Navbar";
import useBoards from "../hooks/useBoards";

// Mounted only after auth, so boards are fetched with a valid token and refreshed per login.
export default function AppLayout() {
  const boardsApi = useBoards();

  return (
    <>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-slate-900 focus:shadow-lg"
      >
        Skip to content
      </a>
      <Navbar />
      <div id="main-content" tabIndex={-1} className="outline-none">
        <Outlet context={boardsApi} />
      </div>
    </>
  );
}

export const useBoardsContext = () => useOutletContext();
