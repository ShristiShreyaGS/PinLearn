import { Link, useNavigate, useParams } from "react-router-dom";
import PageBackdrop from "../PageBackdrop";
import { extractYouTubeId } from "../../../utils/dateUtils";

const statusStyles = {
  saved: "bg-slate-100 text-slate-700 ring-slate-200 dark:bg-slate-700 dark:text-slate-100 dark:ring-slate-600",
  visited: "bg-amber-100 text-amber-800 ring-amber-200 dark:bg-amber-900/30 dark:text-amber-200 dark:ring-amber-800",
  in_progress: "bg-blue-100 text-blue-700 ring-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:ring-blue-800",
  completed: "bg-emerald-100 text-emerald-700 ring-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200 dark:ring-emerald-800"
};

const statusLabels = {
  saved: "Saved",
  visited: "Visited",
  in_progress: "In Progress",
  completed: "Completed"
};

function BoardDetails({
    boards = []
}) {
    const { boardId } = useParams();
    const navigate = useNavigate();

    const board =
        boards.find(
            (board) => board._id === boardId) || null;

    if (!board) {
        return (
            <div className="p-6">
                <h2>Board not found</h2>
            </div>
        );
    }

    const resources = board.resources || [];
    const completedResources = resources.filter((resource) => resource.status === "completed").length;
    const progressPercent = resources.length ? Math.round((completedResources / resources.length) * 100) : 0;

    return (
        <div className="relative isolate min-h-screen bg-transparent p-4 sm:p-6 lg:p-8">
            <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />

            <div className="relative mx-auto max-w-7xl">
                <button
                    onClick={() => navigate("/boards")}
                    className="mb-6 rounded-lg border border-slate-300 bg-white/80 px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900/80 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    ← Back to Boards
                </button>

                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#1e3a8a]">Board</p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-4xl">
                            {board.name}
                        </h1>
                    </div>

                    <div className="min-w-[190px] rounded-xl border border-slate-200 bg-white/90 px-4 py-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/80">
                        <div className="mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                            <span>Progress</span>
                            <span>{completedResources}/{resources.length}</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                            <div
                                className="h-full rounded-full bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] transition-all duration-200"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </div>
                </div>

                {resources.length === 0 ? (
                    <div className="mt-10 rounded-[22px] border border-dashed border-slate-300 bg-white/80 px-6 py-12 text-center shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
                        <p className="text-lg font-semibold text-slate-900 dark:text-white">No resources saved yet</p>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Add a resource to start building your learning board.</p>
                        <button
                            type="button"
                            onClick={() => navigate("/dashboard")}
                            className="mt-5 inline-flex items-center justify-center rounded-full bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_20px_rgba(11,23,54,0.18)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_26px_rgba(11,23,54,0.22)]"
                        >
                            Add resource
                        </button>
                    </div>
                ) : (
                    <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                        {resources.map((resource) => {
                            const resourceStatus = resource.status || "saved";
                            const youtubeId = extractYouTubeId(resource.url);
                            const statusLabel = statusLabels[resourceStatus] || "Saved";
                            const statusClass = statusStyles[resourceStatus] || statusStyles.saved;

                            return (
                                <Link
                                    key={resource.id}
                                    to={`/boards/${board._id}/resources/${resource.id}`}
                                    className="group flex h-full flex-col overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_18px_40px_rgba(15,23,42,0.13)] dark:border-slate-700 dark:bg-slate-800 dark:shadow-[0_12px_30px_rgba(0,0,0,0.28)]"
                                >
                                    {youtubeId ? (
                                        <div className="relative aspect-video w-full overflow-hidden bg-slate-100 dark:bg-slate-700">
                                            <img
                                                src={`https://img.youtube.com/vi/${youtubeId}/hqdefault.jpg`}
                                                alt={resource.title || "Resource thumbnail"}
                                                className="h-full w-full object-cover transition duration-200 group-hover:scale-[1.02]"
                                                loading="lazy"
                                            />
                                        </div>
                                    ) : (
                                        <div className="flex aspect-video items-center justify-center bg-gradient-to-br from-slate-100 via-slate-50 to-slate-200 text-sm font-semibold uppercase tracking-[0.18em] text-slate-500 dark:from-slate-800 dark:via-slate-800 dark:to-slate-700 dark:text-slate-300">
                                            {resource.source || "Resource"}
                                        </div>
                                    )}

                                    <div className="flex flex-1 flex-col p-4">
                                        <div className="mb-3 flex items-center justify-between gap-2">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold tracking-[0.12em] uppercase ring-1 ${statusClass}`}>
                                                {statusLabel}
                                            </span>
                                        </div>

                                        <h3 className="line-clamp-2 text-lg font-semibold leading-6 text-slate-900 dark:text-white">
                                            {resource.title}
                                        </h3>

                                        {resource.description && (
                                            <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                                                {resource.description}
                                            </p>
                                        )}

                                        <div className="mt-auto pt-4">
                                            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500 dark:text-slate-400">
                                                <span>Progress</span>
                                                <span>{completedResources}/{resources.length}</span>
                                            </div>
                                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-[#0b1736] to-[#1e3a8a] transition-all duration-200"
                                                    style={{ width: `${progressPercent}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

export default BoardDetails;