import React, { useEffect, useState } from "react";
import "./Boards.css";

function Boards({
  boards = [],
  loading = false,
  error = "",
  createBoard,
  deleteBoard,
  refreshBoards
}) {
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (refreshBoards) {
      refreshBoards();
    }
  }, [refreshBoards]);

  const selectedBoard =
    boards.find((board) => board._id === selectedBoardId) || null;

  const handleCreateBoard = async () => {
    const boardName = newBoardName.trim();

    if (!boardName || creating) {
      return;
    }

    try {
      setCreating(true);
      setFormError("");
      await createBoard(boardName);
      setNewBoardName("");
      setShowCreateBoard(false);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteBoard = async (event, boardId) => {
    event.stopPropagation();

    try {
      await deleteBoard(boardId);
      if (selectedBoardId === boardId) {
        setSelectedBoardId(null);
      }
    } catch (err) {
      setFormError(err.message);
    }
  };

  const handleOpenBoard = (board) => {
    setSelectedBoardId(board._id);
  };

  const handleCloseBoard = () => {
    setSelectedBoardId(null);
  };

  if (loading) {
    return (
      <div className="boards-page">
        <h2>My Boards</h2>
        <p>Loading boards...</p>
      </div>
    );
  }

  return (
    <div className="boards-page">
      <div className="boards-header">
        <h1>My Boards</h1>

        <button
          className="create-board-btn"
          onClick={() => setShowCreateBoard(true)}
        >
          + Create Board
        </button>
      </div>

      {(error || formError) && (
        <div className="error-message">
          {error || formError}
        </div>
      )}

      {/* Create Board Popup */}
      {showCreateBoard && (
        <div className="board-popup-overlay">
          <div className="board-popup">
            <button
              className="close-popup"
              onClick={() => setShowCreateBoard(false)}
            >
              ×
            </button>

            <h2>Create New Board</h2>

            <input
              type="text"
              placeholder="Enter board name"
              value={newBoardName}
              autoFocus
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateBoard();
                }
              }}
            />

            <button
              className="create-board-confirm"
              onClick={handleCreateBoard}
              disabled={!newBoardName.trim() || creating}
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      )}

      {/* Boards List */}
      {boards.length === 0 ? (
        <div className="empty-boards">
          <h2>No boards yet</h2>
          <p>Create your first board to start saving resources.</p>

          <button
            className="create-board-btn"
            onClick={() => setShowCreateBoard(true)}
          >
            + Create Board
          </button>
        </div>
      ) : (
        <div className="boards-grid">
          {boards.map((board) => (
            <div
              className="board-card"
              key={board._id}
              onClick={() => handleOpenBoard(board)}
            >
              <div className="board-card-content">
                <h2>{board.name}</h2>

                <p>
                  {board.resources?.length || 0}{" "}
                  {board.resources?.length === 1
                    ? "resource"
                    : "resources"}
                </p>
              </div>

              <button
                className="delete-board-btn"
                title="Delete board"
                onClick={(event) => handleDeleteBoard(event, board._id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Selected Board */}
      {selectedBoard && (
        <div className="selected-board-section">
          <div className="selected-board-header">
            <div>
              <h2>{selectedBoard.name}</h2>

              <p>
                {selectedBoard.resources?.length || 0} saved resources
              </p>
            </div>

            <button
              className="close-board-btn"
              onClick={handleCloseBoard}
            >
              ×
            </button>
          </div>

          {selectedBoard.resources?.length === 0 ? (
            <div className="empty-resources">
              <p>No resources saved to this board yet.</p>
            </div>
          ) : (
            <div className="resources-grid">
              {selectedBoard.resources.map((resource) => (
                <div
                  className="resource-card"
                  key={resource.id}
                >
                  {resource.thumbnail && (
                    <img
                      src={resource.thumbnail}
                      alt={resource.title}
                    />
                  )}

                  <div className="resource-card-content">
                    <h3>{resource.title}</h3>

                    {resource.description && (
                      <p>{resource.description}</p>
                    )}

                    {resource.channel && (
                      <small>{resource.channel}</small>
                    )}

                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Open Resource
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Boards;