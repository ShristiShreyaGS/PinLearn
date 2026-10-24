import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const TITLES = [
  [/^\/dashboard/, "Home"],
  [/^\/quiz/, "Daily Quiz"],
  [/^\/boards/, "My Boards"],
  [/^\/kanban/, "Kanban"],
  [/^\/profile/, "Profile"],
  [/^\/topics/, "Explore"],
  [/^\/interests/, "Choose interests"],
  [/^\/$/, "Sign in"]
];

// Per-route document title so browser tabs, history and screen readers announce where the user is.
export default function usePageTitle() {
  const { pathname } = useLocation();

  useEffect(() => {
    const match = TITLES.find(([pattern]) => pattern.test(pathname));
    document.title = match ? `${match[1]} | PinLearn` : "PinLearn";
  }, [pathname]);
}
