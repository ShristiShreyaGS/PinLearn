import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center dark:bg-slate-950">
        <div className="max-w-md">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Something went wrong</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            An unexpected error occurred. Reloading usually fixes it.
          </p>
          <button
            type="button"
            onClick={() => window.location.assign("/")}
            className="mt-5 rounded-full bg-[#0b1736] px-6 py-2.5 text-sm font-semibold text-white"
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
