import { useNavigate, useParams } from "react-router-dom";
import { useState } from "react";
import { addNote, deleteNote, updateNote } from "../../../api/notes";
import { updateResourceStatus } from "../../../api/progress";
import { markActivity } from "../../../api/streak";
import PageBackdrop from "../PageBackdrop";

function ResourceDetails({
    boards = [],
    refreshBoards,
    updateBoardResource
}) {
    const navigate = useNavigate();
    const [noteText, setNoteText] = useState("");
    const [editingNoteIndex, setEditingNoteIndex] = useState(null);
    const [editingNoteText, setEditingNoteText] = useState("");
    const [savingNoteIndex, setSavingNoteIndex] = useState(null);
    const [noteError, setNoteError] = useState("");
    const { boardId, resourceId } =
        useParams();

    const board =
        boards.find(
            (board) => board._id === boardId
        ) || null;

    if (!board) {
        return (
            <div className="p-6">
                <h2>Board not found</h2>
            </div>
        );
    }

    const resource =
        board.resources.find(
            (resource) =>
                String(resource.id) === String(resourceId)
        ) || null;

    if (!resource) {
        return (
            <div className="p-6">
                <h2>Resource not found</h2>
            </div>
        );
    }

    const handleSaveEditedNote = async (noteIndex) => {
        const content = editingNoteText.trim();

        if (!content || savingNoteIndex !== null) {
            return;
        }

        try {
            setSavingNoteIndex(noteIndex);
            setNoteError("");
            const response = await updateNote(boardId, resource.id, noteIndex, content);

            updateBoardResource(boardId, resource.id, { notes: response.notes });
            if (typeof refreshBoards === "function") {
                await refreshBoards();
            }
            setEditingNoteIndex(null);
            setEditingNoteText("");
        } catch (error) {
            setNoteError(error.message || "Unable to save this note.");
        } finally {
            setSavingNoteIndex(null);
        }
    };

    return (
        <main className="relative isolate min-h-screen bg-transparent px-4 py-8 dark:bg-transparent sm:px-6 lg:px-10">
            <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
            <div className="mx-auto max-w-6xl">
                <button
                    onClick={() => navigate(`/boards/${boardId}`)}
                    className="mb-6 rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    ← Back to Board
                </button>

                <header className="mb-8">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-[#1e3a8a]">
                        Resource details
                    </p>
                    <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                        {resource.title}
                    </h1>
                </header>

                <div className="grid overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_18px_50px_rgba(15,23,42,0.08)] dark:border-slate-800 dark:bg-slate-900 dark:shadow-none lg:grid-cols-[minmax(0,1.6fr)_minmax(280px,0.75fr)]">
                    <section className="p-5 sm:p-9">
                        <div className="mb-7 flex items-end justify-between gap-4 border-b border-slate-200 pb-6 dark:border-slate-800">
                            <div>
                                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1e3a8a]">
                                    Notes Area
                                </p>
                                <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                                    Working notes
                                </h2>
                            </div>
                            <span className="rounded-full bg-blue-50 px-3 py-1.5 text-sm font-bold text-[#1e3a8a] dark:bg-blue-950/30 dark:text-blue-200">
                                {resource.notes?.length || 0}
                            </span>
                        </div>

                        {noteError && (
                            <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
                                {noteError}
                            </div>
                        )}

                        {resource.notes?.length > 0 ? (
                            <div className="space-y-3">
                                {resource.notes.map((note, index) => (
                                    <article
                                        key={index}
                                        className="group rounded-2xl border border-slate-200 bg-slate-50/80 p-5 transition hover:border-slate-300 hover:bg-white hover:shadow-[0_8px_24px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-950/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                                    >
                                        {editingNoteIndex === index ? (
                                            <textarea
                                                className="min-h-24 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                                value={editingNoteText}
                                                onChange={(event) => setEditingNoteText(event.target.value)}
                                            />
                                        ) : (
                                            <p className="whitespace-pre-wrap text-sm leading-6 text-slate-700 dark:text-slate-200">
                                                {note.content}
                                            </p>
                                        )}

                                        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                                            <small className="text-xs font-medium text-slate-400">
                                                {new Date(note.createdAt).toLocaleDateString()}
                                            </small>
                                            <div>
                                                {editingNoteIndex === index ? (
                                                    <>
                                                        <button
                                                            className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                                            onClick={() => handleSaveEditedNote(index)}
                                                            disabled={savingNoteIndex !== null}
                                                        >
                                                            {savingNoteIndex === index ? "Saving..." : "Save Changes"}
                                                        </button>
                                                        <button
                                                            className="ml-2 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 dark:border-slate-700 dark:text-slate-300"
                                                            disabled={savingNoteIndex !== null}
                                                            onClick={() => {
                                                                setEditingNoteIndex(null);
                                                                setEditingNoteText("");
                                                            }}
                                                        >
                                                            Cancel
                                                        </button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <button
                                                            className="rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-900"
                                                            onClick={() => {
                                                                setEditingNoteIndex(index);
                                                                setEditingNoteText(note.content);
                                                            }}
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            className="ml-2 rounded-lg px-3 py-2 text-xs font-semibold text-red-600 transition hover:bg-red-50 dark:hover:bg-red-950/30"
                                                            onClick={async () => {
                                                                if (!window.confirm("Delete this note?")) return;

                                                                try {
                                                                    await deleteNote(boardId, resource.id, index);
                                                                    updateBoardResource(boardId, resource.id, {
                                                                        notes: resource.notes.filter((_, noteIndex) => noteIndex !== index)
                                                                    });
                                                                } catch (error) {
                                                                    console.error(error);
                                                                }
                                                            }}
                                                        >
                                                            Delete
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-xl border border-dashed border-slate-300 px-5 py-10 text-center dark:border-slate-700">
                                <p className="font-semibold text-slate-700 dark:text-slate-200">No notes yet</p>
                                <p className="mt-1 text-sm text-slate-500">Capture an idea or reminder about this resource.</p>
                            </div>
                        )}

                        <div className="mt-8 border-t border-slate-200 pt-6 dark:border-slate-800">
                            <h3 className="mb-3 text-lg font-bold text-slate-900 dark:text-white">Add a note</h3>
                            <textarea
                                className="min-h-28 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 text-sm text-slate-700 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200"
                                placeholder="Write a note..."
                                value={noteText}
                                onChange={(event) => setNoteText(event.target.value)}
                            />
                            <button
                                className="mt-3 rounded-full bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_6px_16px_rgba(11,23,54,0.2)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_20px_rgba(11,23,54,0.25)]"
                                onClick={async () => {
                                    const note = noteText.trim();
                                    if (!note) return;

                                    try {
                                        const response = await addNote(boardId, resource.id, note);
                                        setNoteText("");
                                        updateBoardResource(boardId, resource.id, { notes: response.notes });
                                        if (typeof refreshBoards === "function") {
                                            await refreshBoards();
                                        }
                                    } catch (error) {
                                        console.error(error);
                                    }
                                }}
                            >
                                Save Note
                            </button>
                        </div>
                    </section>

                    <aside className="border-t border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-950/50 sm:p-9 lg:border-l lg:border-t-0">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1e3a8a]">Resource Info</p>
                        <div className="mt-4 h-px w-10 bg-[#1e3a8a]" />
                        <div className="mt-6 space-y-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status</p>
                                <select
                                    className="mt-2 h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                                    value={resource.status || "saved"}
                                    onChange={async (event) => {
                                        try {
                                            const newStatus = event.target.value;
                                            const response = await updateResourceStatus(boardId, resource.id, newStatus);
                                            updateBoardResource(boardId, resource.id, response.resource);
                                            if (newStatus === "completed") {
                                                markActivity().catch(() => {});
                                            }
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

                            {resource.channel && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Channel</p>
                                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{resource.channel}</p>
                                </div>
                            )}

                            {resource.source && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Source</p>
                                    <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">{resource.source}</p>
                                </div>
                            )}

                            {resource.description && (
                                <div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Description</p>
                                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{resource.description}</p>
                                </div>
                            )}

                            {resource.url && (
                                <a
                                    href={resource.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex w-full items-center justify-center rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200"
                                >
                                    Open Link ↗
                                </a>
                            )}
                        </div>
                    </aside>
                </div>
            </div>
        </main>
    );
}

export default ResourceDetails;