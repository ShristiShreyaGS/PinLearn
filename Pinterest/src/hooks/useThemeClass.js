import { useEffect, useRef } from "react";

// Syncs the persisted theme to the <html> class, animating every change except the first render.
export default function useThemeClass(mode) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    const root = document.documentElement;
    let timer;

    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      root.classList.add("theme-transition");
      timer = window.setTimeout(() => root.classList.remove("theme-transition"), 400);
    }

    root.classList.toggle("dark", mode === "dark");

    return () => window.clearTimeout(timer);
  }, [mode]);
}
