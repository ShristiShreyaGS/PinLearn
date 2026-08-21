import { BrowserRouter, Routes, Route } from "react-router-dom";
import Auth from "./components/Page/Auth/Auth";
import Interests from "./components/Page/Interests/Interests";
import Dashboard from "./components/Page/Dashboard/Dashboard";
import Boards from "./components/Page/Boards/Boards";
import Kanban from "./components/Page/Kanban/Kanban";
import Navbar from "./components/Navbar/Navbar";
import useBoards from "./hooks/useBoards";
import Profile from "./components/Page/Profile/Profile";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import BoardDetails from "./components/Page/Boards/BoardDetails";
import ResourceDetails from "./components/Page/Boards/ResourceDetails";

function App() {
  const mode = useSelector(
    (state) => state.theme.mode
  );

  useEffect(() => {
    document.documentElement.classList.toggle(
      "dark",
      mode === "dark"
    );
  }, [mode]);
  const {
    boards,
    loading: boardsLoading,
    error: boardsError,
    refreshBoards,
    createBoard,
    saveResourceToBoard,
    deleteBoard,
    updateBoardResource
  } = useBoards();

  return (


    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/interests" element={<Interests />} />
        <Route
          path="/profile"
          element={
            <>
              <Navbar />
              <Profile />
            </>
          }
        />
        <Route
          path="/dashboard"
          element={
            <>
              <Navbar />
              <Dashboard
                boards={boards}
                createBoard={createBoard}
                saveResourceToBoard={saveResourceToBoard}
                refreshBoards={refreshBoards}
              />
            </>
          }
        />
        <Route
          path="/boards"
          element={
            <>
              <Navbar />
              <Boards
                boards={boards}
                loading={boardsLoading}
                error={boardsError}
                createBoard={createBoard}
                deleteBoard={deleteBoard}
                refreshBoards={refreshBoards}
                updateBoardResource={updateBoardResource}
              />
            </>
          }
        />
        <Route
          path="/boards/:boardId"
          element={
            <>
              <Navbar />
              <BoardDetails
                boards={boards}
                updateBoardResource={updateBoardResource} />
            </>
          }
        />
        <Route
          path="/boards/:boardId/resources/:resourceId"
          element={
            <>
              <Navbar />
<ResourceDetails
  boards={boards}
  updateBoardResource={updateBoardResource}
  refreshBoards={refreshBoards}
/>            </>
          }
        />
        <Route
          path="/kanban"
          element={
            <>
              <Navbar />
              <Kanban />
            </>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;