import { Link } from "react-router-dom";
import { hasSession } from "../../routes/RequireAuth";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center dark:bg-slate-950">
      <div className="max-w-md">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-blue-700 dark:text-blue-300">Error 404</p>
        <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-900 dark:text-white">Page not found</h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          The page you are looking for does not exist or has moved.
        </p>
        <Link
          to={hasSession() ? "/dashboard" : "/"}
          className="mt-6 inline-flex rounded-full bg-gradient-to-br from-[#0b1736] to-[#1e3a8a] px-6 py-3 text-sm font-semibold text-white"
        >
          {hasSession() ? "Back to dashboard" : "Go to sign in"}
        </Link>
      </div>
    </main>
  );
}
