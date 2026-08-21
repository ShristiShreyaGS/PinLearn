import { useNavigate, useParams } from "react-router-dom";
import PageBackdrop from "../PageBackdrop";

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

    return (
        
        <div className="relative isolate min-h-screen bg-transparent p-6">
            <PageBackdrop className="pointer-events-none absolute inset-0 z-0 min-h-full" />
            <button
  onClick={() => navigate("/boards")}
  className="mb-6 rounded-lg border border-slate-300 dark:border-slate-700 px-4 py-2 text-slate-700 dark:text-slate-200"
>
  ← Back to Boards
</button>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                {board.name}
            </h1>

           <p className="mt-2 text-slate-500">
  {board.resources.length} resources
</p>
<p className="mt-2 text-slate-500">
  {
    board.resources.filter(
      (resource) => resource.status === "completed"
    ).length
  }
  {" / "}
  {board.resources.length}
  {" completed"}
</p>

            <div className="mt-8">
                <div className="mt-8 grid gap-6">
                    {board.resources.map((resource) => (
                        <div
                            key={resource.id}
                            className="rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-5"
                        >
                            <h3 className="text-lg font-semibold">
                                {resource.title}
                            </h3>

                            <p className="mt-2 text-sm text-slate-500">
                                Status: {resource.status}
                            </p>

                            {resource.description && (
                                <p className="mt-3 text-slate-600 dark:text-slate-300">
                                    {resource.description}
                                </p>
                            )}
                            <button
                                className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-white"
                                onClick={() =>
                                    navigate(
                                        `/boards/${board._id}/resources/${resource.id}`
                                    )
                                }
                            >
                                Open Details
                            </button>
                        </div>
                    ))}
                </div>
            </div>
            
        </div>
        
    );
}

export default BoardDetails;