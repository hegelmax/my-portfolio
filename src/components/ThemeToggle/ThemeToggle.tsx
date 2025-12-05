import { useEffect, useMemo, useRef, useState } from "react";
import "./ThemeToggle.scss";

type ThemeMode = "light" | "dark" | "auto";

const STORAGE_KEY = "site-theme";

const getInitialMode = (): ThemeMode => {
  if (typeof window === "undefined") return "light";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark" || stored === "auto") return stored;
  return "light";
};

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>(getInitialMode);
  const [showNotice, setShowNotice] = useState(false);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedTheme = useMemo<"light" | "dark">(() => {
    if (mode !== "auto") return mode;
    if (typeof window === "undefined") return "light";
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, [mode]);

  useEffect(() => {
    document.body.dataset.siteTheme = resolvedTheme;
    document.body.dataset.siteThemeMode = mode;
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [mode, resolvedTheme]);

  useEffect(() => {
    if (mode !== "auto") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      document.body.dataset.siteTheme = mql.matches ? "dark" : "light";
    };
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [mode]);

  const cycleMode = () => {
    setMode((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  };

  const prevMode = useRef<ThemeMode>(mode);

  useEffect(() => {
    const shouldShowToast = prevMode.current !== mode && mode === "auto";
    if (!shouldShowToast) {
      prevMode.current = mode;
      return;
    }
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setShowNotice(true);
    noticeTimer.current = setTimeout(() => setShowNotice(false), 5000);
    prevMode.current = mode;
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [mode]);

  return (
    <>
      <button
        className="theme-toggle"
        type="button"
        onClick={cycleMode}
        aria-label="Switch theme"
        title="Switch theme"
      >
        {mode === "auto" ? (
          <i className="fa-solid fa-circle-half-stroke" aria-hidden="true" />
        ) : resolvedTheme === "light" ? (
          <i className="fa-solid fa-sun" aria-hidden="true" />
        ) : (
          <i className="fa-solid fa-moon" aria-hidden="true" />
        )}
      </button>
      {showNotice && (
        <div className="theme-toggle__toast">
          <div className="theme-toggle__toast-bar" />
          <div className="theme-toggle__toast-title">System theme</div>
          <div className="theme-toggle__toast-text">Following your device appearance automatically.</div>
        </div>
      )}
    </>
  );
}
