import React, { useEffect, useState } from "react";
import { updateResourceStatus } from "../../../api/progress";
import { addNote,deleteNote } from "../../../api/notes";

function Boards({
  boards = [],
  loading = false,
  error = "",
  createBoard,
  deleteBoard,
  refreshBoards,
  updateBoardResource
}) {
  const [selectedBoardId, setSelectedBoardId] = useState(null);

  const [showCreateBoard, setShowCreateBoard] = useState(false);
  const [newBoardName, setNewBoardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [formError, setFormError] = useState("");
  const [noteText, setNoteText] = useState({});
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
    const confirmed=window.confirm(
      "Are you sure you want to delete this board?\n\nAll saved resources and notes inside this board will be lost.");
      if(!confirmed){
        return;
      }
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
      <div className="min-h-screen bg-white dark:bg-slate-950 mx-auto max-w-7xl px-4 py-8 pb-12 sm:px-6 lg:px-10">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">My Boards</h2>
        <p className="mt-2 text-slate-500 dark:text-slate-400">Loading boards...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 mx-auto max-w-7xl px-4 py-8 pb-12 sm:px-6 lg:px-10">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4 max-md:flex-col max-md:items-start">
        <h1 className="m-0 text-4xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-[44px]">My Boards</h1>

        <button
          className="cursor-pointer rounded-full border-0 bg-gradient-to-br from-[#e60023] to-[#ff3b30] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(230,0,35,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(230,0,35,0.35)] max-sm:w-full"
          onClick={() => setShowCreateBoard(true)}
        >
          + Create Board
        </button>
      </div>

      {(error || formError) && (
        <div className="my-5 rounded-[14px] border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950 px-[18px] py-3.5 font-medium text-red-700 dark:text-red-200">
          {error || formError}
        </div>
      )}

      {/* Create Board Popup */}
      {showCreateBoard && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/55 dark:bg-black/70 p-4 backdrop-blur-[8px]">
          <div className="relative w-[min(450px,92vw)] rounded-3xl bg-white dark:bg-slate-900 bg-opacity-95 p-6 shadow-[0_20px_40px_rgba(15,23,42,0.18),0_30px_80px_rgba(15,23,42,0.12)] sm:p-[30px]">
            <button
              className="absolute right-4 top-3 cursor-pointer border-0 bg-transparent text-[28px] text-slate-500 transition hover:text-red-500"
              onClick={() => setShowCreateBoard(false)}
            >
              ×
            </button>

            <h2 className="mb-5 text-2xl font-bold text-slate-900 dark:text-white">Create New Board</h2>

            <input
              type="text"
              placeholder="Enter board name"
              value={newBoardName}
              autoFocus
              className="box-border w-full rounded-[14px] border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-4 py-3.5 text-[15px] text-slate-900 dark:text-white outline-none transition placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10"
              onChange={(e) => setNewBoardName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleCreateBoard();
                }
              }}
            />

            <button
              className="mt-3 w-full cursor-pointer rounded-full border-0 bg-gradient-to-br from-[#e60023] to-[#ff3b30] p-3.5 text-[15px] font-semibold text-white transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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
        <div className="mt-[60px] p-10 text-center bg-slate-50 dark:bg-slate-900 rounded-lg">
          <h2 className="mb-2.5 text-2xl font-bold text-slate-900 dark:text-white">No boards yet</h2>
          <p className="mb-6 text-slate-500 dark:text-slate-400">Create your first board to start saving resources.</p>

          <button
            className="cursor-pointer rounded-full border-0 bg-gradient-to-br from-[#e60023] to-[#ff3b30] px-6 py-3 text-[15px] font-semibold text-white shadow-[0_8px_20px_rgba(230,0,35,0.25)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(230,0,35,0.35)] max-sm:w-full"
            onClick={() => setShowCreateBoard(true)}
          >
            + Create Board
          </button>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(280px,1fr))] items-stretch gap-[22px]">
          {boards.map((board) => {
            const totalResources = board.resources?.length || 0;

            const completedResources =
              board.resources?.filter(
                (resource) => resource.status === "completed"
              ).length || 0;

            const progressPercentage =
              totalResources === 0
                ? 0
                : Math.round(
                  (completedResources / totalResources) * 100
                );

            return (
              <div
                className="group relative min-h-[190px] cursor-pointer overflow-hidden rounded-[22px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06),0_18px_40px_rgba(15,23,42,0.08)] dark:shadow-[0_8px_24px_rgba(0,0,0,0.3)] transition duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_28px_rgba(15,23,42,0.1),0_24px_50px_rgba(15,23,42,0.14)] sm:p-6"
                key={board._id}
                onClick={() => handleOpenBoard(board)}
              >
                <div className="board-card-content">
                  <h2 className="text-[1.35rem] font-semibold leading-tight text-slate-900 dark:text-white">{board.name}</h2>

                  <p className="mt-2.5 text-slate-500 dark:text-slate-400">
                    {totalResources}{" "}
                    {totalResources === 1
                      ? "resource"
                      : "resources"}
                  </p>

                  <p className="text-slate-500 dark:text-slate-400">{completedResources} completed</p>

                  <p className="text-slate-500 dark:text-slate-400">{progressPercentage}% progress</p>


                  <div className="mt-2.5 h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-slate-700">
                    <div
                      className="h-full rounded-full bg-green-500 transition-[width] duration-300"
                      style={{
                        width: `${progressPercentage}%`
                      }}
                    />
                  </div>
                </div>

                <button
                  className="absolute right-3.5 top-3 h-9 w-9 cursor-pointer rounded-full border-0 bg-slate-50 text-xl text-slate-400 transition hover:scale-105 hover:bg-red-100 hover:text-red-600"
                  title="Delete board"
                  onClick={(event) =>
                    handleDeleteBoard(event, board._id)
                  }
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Board */}
      {selectedBoard && (
        <div className="mt-[50px] border-t border-slate-200 dark:border-slate-700 pt-8">
          <div className="mb-5 flex items-start justify-between gap-4 max-md:flex-col">
            <div>
              <h2 className="mb-1.5 text-2xl font-bold text-slate-900 dark:text-white">{selectedBoard.name}</h2>

              <p className="text-slate-500 dark:text-slate-400">
                {
                  selectedBoard.resources.filter(
                    (resource) => resource.status === "completed"
                  ).length
                }
                {" / "}
                {selectedBoard.resources.length}
                {" completed"}
              </p>
            </div>

            <button
              className="cursor-pointer border-0 bg-transparent text-2xl text-slate-500 transition hover:text-red-500"
              onClick={handleCloseBoard}
            >
              ×
            </button>
          </div>

          {selectedBoard.resources?.length === 0 ? (
            <div className="mt-4 text-slate-500 dark:text-slate-400">
              <p>No resources saved to this board yet.</p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] items-stretch gap-[22px] max-sm:grid-cols-1">
              {selectedBoard.resources.map((resource) => (
                <div
                  className="flex h-full flex-col overflow-hidden rounded-[18px] border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-[0_6px_18px_rgba(15,23,42,0.05)] dark:shadow-[0_6px_18px_rgba(0,0,0,0.3)] transition hover:-translate-y-1.5 hover:shadow-[0_12px_26px_rgba(15,23,42,0.12)] dark:hover:shadow-[0_12px_26px_rgba(0,0,0,0.4)]"
                  key={resource.id}
                >
                  {resource.thumbnail && (
                    <div className="h-[180px] shrink-0 bg-slate-100">
                      <img
                        src={resource.thumbnail}
                        alt={resource.title}
                        className="block h-full w-full object-cover"
                      />
                    </div>
                  )}
                  <div className="px-4 pt-4">
                    <p className="my-2 inline-block rounded-full bg-indigo-50 px-2.5 py-1 text-[0.85rem] font-semibold text-indigo-600">
                      Status: {resource.status || "saved"}
                    </p>
                    <select
                      className="my-2 block h-10 w-full rounded-lg border border-gray-300 bg-white px-3 text-sm text-slate-700"
                      value={resource.status || "saved"}
                      onChange={async (e) => {
                        try {
                          const response = await updateResourceStatus(
                            selectedBoard._id,
                            resource.id,
                            e.target.value
                          );
                          updateBoardResource(
                            selectedBoard._id,
                            resource.id,
                            response.resource
                          );
                        } catch (error) {
                          console.error("Failed to update status:", error);
                        }
                      }}
                    >
                      <option value="saved">Saved</option>
                      <option value="visited">Visited</option>
                      <option value="in_progress">In Progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>
                  <div className="px-4">
                    <textarea
                      className="mt-2.5 block min-h-20 w-full resize-y rounded-[10px] border border-gray-300 p-2.5 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/10"
                      placeholder="Write a note..."
                      value={noteText[resource.id] || ""}
                      onChange={(e) =>
                        setNoteText({
                          ...noteText,
                          [resource.id]: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className="px-4">
                    <button
                      className="mt-2 cursor-pointer rounded-lg border-0 bg-blue-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
                      onClick={async () => {
                        const note = noteText[resource.id]?.trim();

                        if (!note) {
                          return;
                        }

                        try {
                          const response = await addNote(
                            selectedBoard._id,
                            resource.id,
                            note
                          );

                          updateBoardResource(
                            selectedBoard._id,
                            resource.id,
                            { notes: response.notes }
                          );

                          setNoteText({
                            ...noteText,
                            [resource.id]: ""
                          });

                        } catch (error) {
                          console.error("Failed to save note:", error);
                        }
                      }}
                    >
                      Save Note
                    </button>
                  </div>
                  <div className="mt-4 flex-1 border-t border-slate-100 p-4">
                    <h3 className="mb-2 text-base font-semibold text-slate-900">{resource.title}</h3>

                    {resource.description && (
                      <p className="text-sm leading-relaxed text-slate-500">{resource.description}</p>
                    )}

                    {resource.channel && (
                      <small className="text-slate-500">{resource.channel}</small>
                    )}
                    {resource.notes?.length > 0 && (
  <div className="mt-4 border-t border-slate-200 pt-3">
    <h4 className="mb-2 text-sm font-semibold text-slate-800">
      Notes
    </h4>

    {resource.notes.map((note, index) => (
      <div
  key={index}
  className="mb-2 rounded-lg bg-slate-50 p-2"
>
  <div className="flex items-start justify-between gap-2">
    <p className="text-sm text-slate-700">
      {note.content}
    </p>

    <button
      className="text-red-500 hover:text-red-700"
      onClick={async () => {
        const confirmed=window.confirm(
          "Are you sure you want to delete this note? "
        );
        if(!confirmed){
          return;
        }
        try {
          await deleteNote(
            selectedBoard._id,
            resource.id,
            index
          );

          updateBoardResource(
            selectedBoard._id,
            resource.id,
            {
              notes: resource.notes.filter((_, noteIndex) => noteIndex !== index)
            }
          );
        } catch (error) {
          console.error(error);
        }
      }}
    >
      ✕
    </button>
  </div>

  <small className="text-slate-400">
    {new Date(
      note.createdAt
    ).toLocaleDateString()}
  </small>
</div>

    ))}
  </div>
)}

                    {resource.url && (
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                       <div> <span className="mt-3 inline-block font-medium text-blue-600 hover:underline"> Open Resource</span></div>
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