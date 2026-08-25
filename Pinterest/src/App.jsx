import { BrowserRouter, Routes, Route, Navigate, useParams, useSearchParams } from "react-router-dom";
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
import Topic from "./components/Page/Topic/Topic";
import Quiz from "./components/Page/Quiz/Quiz";

function LegacyTopicRedirect() {
  const { topic } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") === "repository" ? "repositories" : "videos";

  return <Navigate replace to={`/topics/${encodeURIComponent(topic || "")}/${source}`} />;
}

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
          path="/quiz"
          element={
            <>
              <Navbar />
              <Quiz />
            </>
          }
        />
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
          path="/topics/:topic/:source"
          element={
            <>
              <Navbar />
              <Topic
                boards={boards}
                createBoard={createBoard}
                saveResourceToBoard={saveResourceToBoard}
                refreshBoards={refreshBoards}
              />
            </>
          }
        />
        <Route path="/topics/:topic" element={<LegacyTopicRedirect />} />
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