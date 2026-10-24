import { Navigate, useParams, useSearchParams } from "react-router-dom";
import Dashboard from "../components/Page/Dashboard/Dashboard";
import Boards from "../components/Page/Boards/Boards";
import BoardDetails from "../components/Page/Boards/BoardDetails";
import ResourceDetails from "../components/Page/Boards/ResourceDetails";
import Topic from "../components/Page/Topic/Topic";
import { useBoardsContext } from "./AppLayout";

// Thin adapters that feed shared board state from the layout into each page's existing props.

export function DashboardRoute() {
  const { boards, createBoard, saveResourceToBoard, refreshBoards } = useBoardsContext();
  return (
    <Dashboard
      boards={boards}
      createBoard={createBoard}
      saveResourceToBoard={saveResourceToBoard}
      refreshBoards={refreshBoards}
    />
  );
}

export function TopicRoute() {
  const { boards, createBoard, saveResourceToBoard, refreshBoards } = useBoardsContext();
  return (
    <Topic
      boards={boards}
      createBoard={createBoard}
      saveResourceToBoard={saveResourceToBoard}
      refreshBoards={refreshBoards}
    />
  );
}

export function BoardsRoute() {
  const { boards, loading, error, createBoard, deleteBoard, refreshBoards, updateBoardResource } =
    useBoardsContext();
  return (
    <Boards
      boards={boards}
      loading={loading}
      error={error}
      createBoard={createBoard}
      deleteBoard={deleteBoard}
      refreshBoards={refreshBoards}
      updateBoardResource={updateBoardResource}
    />
  );
}

export function BoardDetailsRoute() {
  const { boards, updateBoardResource } = useBoardsContext();
  return <BoardDetails boards={boards} updateBoardResource={updateBoardResource} />;
}

export function ResourceDetailsRoute() {
  const { boards, updateBoardResource, refreshBoards } = useBoardsContext();
  return (
    <ResourceDetails
      boards={boards}
      updateBoardResource={updateBoardResource}
      refreshBoards={refreshBoards}
    />
  );
}

export function LegacyTopicRedirect() {
  const { topic } = useParams();
  const [searchParams] = useSearchParams();
  const source = searchParams.get("source") === "repository" ? "repositories" : "videos";

  return <Navigate replace to={`/topics/${encodeURIComponent(topic || "")}/${source}`} />;
}
