import { useCallback, useEffect, useState } from "react";
import {
  createBoardRequest,
  deleteBoardRequest,
  fetchBoards,
  saveResourceRequest
} from "../api/boards";

// Single source of truth for the logged-in user's boards (server-backed).
export default function useBoards() {
  const [boards, setBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshBoards = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = await fetchBoards();
      setBoards(Array.isArray(data) ? data : []);
    } catch (err) {
      setBoards([]);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshBoards();
  }, [refreshBoards]);

  const createBoard = useCallback(async (name) => {
    const board = await createBoardRequest(name);
    setBoards((previous) => [...previous, board]);
    return board;
  }, []);

  const saveResourceToBoard = useCallback(async (boardId, resource) => {
    const updatedBoard = await saveResourceRequest(boardId, resource);
    setBoards((previous) =>
      previous.map((board) => (board._id === updatedBoard._id ? updatedBoard : board))
    );
    return updatedBoard;
  }, []);

  const deleteBoard = useCallback(async (boardId) => {
    await deleteBoardRequest(boardId);
    setBoards((previous) => previous.filter((board) => board._id !== boardId));
  }, []);

  return {
    boards,
    loading,
    error,
    refreshBoards,
    createBoard,
    saveResourceToBoard,
    deleteBoard
  };
}
