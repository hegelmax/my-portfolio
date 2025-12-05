import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useLocation } from "react-router";

import "./AdminLayout.scss";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const isLoginPage = location.pathname === "/admin";
  const isSetPasswordPage = location.pathname.startsWith("/admin/set-password");
  const isAuthFreePage = isLoginPage || isSetPasswordPage;
  const [currentRole, setCurrentRole] = React.useState<string>("admin");
  const [currentName, setCurrentName] = React.useState<string | null>(null);
  const isObserver = currentRole === "observer";
  type AdminThemeMode = "light" | "dark" | "auto";
  const [themeMode, setThemeMode] = React.useState<AdminThemeMode>(() => {
    const saved = localStorage.getItem("admin-theme");
    if (saved === "light" || saved === "dark" || saved === "auto") return saved;
    return "dark";
  });
  const [showNotice, setShowNotice] = React.useState(false);
  const noticeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevThemeMode = React.useRef<AdminThemeMode>(themeMode);
  const [showForbidden, setShowForbidden] = React.useState(false);
  const forbiddenTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolvedTheme = React.useMemo<"light" | "dark">(() => {
    if (themeMode !== "auto") return themeMode;
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }, [themeMode]);

  React.useEffect(() => {
    const handler = () => {
      if (forbiddenTimer.current) clearTimeout(forbiddenTimer.current);
      setShowForbidden(true);
      forbiddenTimer.current = setTimeout(() => setShowForbidden(false), 5000);
    };

    const origFetch = window.fetch;
    window.fetch = async (...args) => {
      const resp = await origFetch(...args);
      if (resp.status === 403) {
        window.dispatchEvent(new CustomEvent("admin-forbidden"));
      }
      return resp;
    };

    window.addEventListener("admin-forbidden", handler);
    return () => {
      window.removeEventListener("admin-forbidden", handler);
      if (forbiddenTimer.current) clearTimeout(forbiddenTimer.current);
      window.fetch = origFetch;
    };
  }, []);

  React.useEffect(() => {
    if (isAuthFreePage) return;
    const fetchUser = async () => {
      try {
        const resp = await fetch("/api/admin/auth/state", { credentials: "include" });
        const data = await resp.json();
        if (data?.user) {
          setCurrentRole(data.user.role ?? "admin");
          setCurrentName(data.user.name ?? null);
        }
      } catch {
        // ignore
      }
    };
    fetchUser();
  }, [isAuthFreePage]);

  React.useEffect(() => {
    localStorage.setItem("admin-theme", themeMode);
    document.body.classList.add("admin-theme");
    document.body.dataset.adminTheme = resolvedTheme;
    return () => {
      document.body.classList.remove("admin-theme");
      delete document.body.dataset.adminTheme;
    };
  }, [resolvedTheme, themeMode]);

  React.useEffect(() => {
    if (themeMode !== "auto") return;
    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => {
      document.body.dataset.adminTheme = mql.matches ? "dark" : "light";
    };
    mql.addEventListener("change", listener);
    return () => mql.removeEventListener("change", listener);
  }, [themeMode]);

  React.useEffect(() => {
    const shouldShow = prevThemeMode.current !== themeMode && themeMode === "auto";
    if (!shouldShow) {
      prevThemeMode.current = themeMode;
      return;
    }
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    setShowNotice(true);
    noticeTimer.current = setTimeout(() => setShowNotice(false), 5000);
    prevThemeMode.current = themeMode;
    return () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    };
  }, [themeMode]);

  const cycleTheme = () => {
    setThemeMode((prev) => {
      if (prev === "light") return "dark";
      if (prev === "dark") return "auto";
      return "light";
    });
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // Even if the request fails, still redirect user to login page
    } finally {
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div className={`admin-root theme-${resolvedTheme}`}>
      <header className="admin-header">
        <div className="admin-header__left">
          <span className="admin-logo">MyPorfolio Admin</span>
          {!isAuthFreePage && currentName && <span className="admin-user">{currentName} · {currentRole}</span>}
        </div>
        <div className="admin-header__right">
          <button
            className="admin-header__theme-btn"
            type="button"
            onClick={cycleTheme}
            aria-label="Switch theme"
            title="Switch theme"
          >
            {themeMode === "auto" ? (
              <i className="fa-solid fa-circle-half-stroke" aria-hidden="true" />
            ) : resolvedTheme === "light" ? (
              <i className="fa-solid fa-sun" aria-hidden="true" />
            ) : (
              <i className="fa-solid fa-moon" aria-hidden="true" />
            )}
          </button>
          {!isAuthFreePage && (
            <button
              className="admin-header__logout-btn"
              type="button"
              onClick={handleLogout}
            >
              Logout
            </button>
          )}
        </div>
      </header>

      {isObserver && (
        <div className="admin-readonly-banner">
          <div className="admin-readonly-banner__bar" />
          <div className="admin-readonly-banner__title">Info</div>
          <div className="admin-readonly-banner__text">You are signed in as an observer. Editing is disabled.</div>
        </div>
      )}

      <div className={`admin-body${isAuthFreePage ? " admin-body--full" : ""}`}>
        {!isAuthFreePage && (
          <nav className="admin-sidebar">
            <div className="admin-sidebar__section">
              <div className="admin-sidebar__title">Content</div>
              <NavLink to="/admin/dashboard" className="admin-sidebar__link">
                Dashboard
              </NavLink>
              <NavLink to="/admin/projects" className="admin-sidebar__link">
                Projects
              </NavLink>
              <NavLink to="/admin/media" className="admin-sidebar__link">
                Media Library
              </NavLink>
              <NavLink to="/admin/galleries" className="admin-sidebar__link">
                Galleries
              </NavLink>
              <NavLink to="/admin/pdf" className="admin-sidebar__link">
                PDF works
              </NavLink>
              <NavLink to="/admin/seo" className="admin-sidebar__link">
                SEO
              </NavLink>
              {currentRole === "admin" && (
                <NavLink to="/admin/users" className="admin-sidebar__link">
                  Users
                </NavLink>
              )}
            </div>
          </nav>
        )}

        <main className="admin-content">
          {children}
        </main>
      </div>
      {showNotice && (
        <div className="admin-theme-toast">
          <div className="admin-theme-toast__bar" />
          <div className="admin-theme-toast__title">System theme</div>
          <div className="admin-theme-toast__text">Following your device appearance automatically.</div>
        </div>
      )}
      {showForbidden && (
        <div className="admin-forbidden-toast">
          <div className="admin-forbidden-toast__bar" />
          <div className="admin-forbidden-toast__title">Error!</div>
          <div className="admin-forbidden-toast__text">You do not have permission to perform this action.</div>
        </div>
      )}
    </div>
  );
};

export default AdminLayout;
