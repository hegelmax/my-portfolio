import React from "react";
import { useNavigate } from "react-router-dom";

import "./AdminLayout.scss";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch {
      // даже если запрос упал, просто отправим пользователя на страницу логина
    } finally {
      navigate("/admin", { replace: true });
    }
  };

  return (
    <div className="admin-root">
      <header className="admin-header">
        <div className="admin-header__left">
          <span className="admin-logo">NP Admin</span>
        </div>
        <div className="admin-header__right">
          {/* сюда потом выведем имя админа, кнопку logout и т.п. */}
          <button
            className="admin-header__logout-btn"
            type="button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </div>
      </header>

      <div className="admin-body">
        <nav className="admin-sidebar">
          <div className="admin-sidebar__section">
            <div className="admin-sidebar__title">Content</div>
            <a href="/admin/dashboard" className="admin-sidebar__link">
              Dashboard
            </a>
            <a href="/admin/projects" className="admin-sidebar__link">
              Projects
            </a>
            <a href="/admin/media" className="admin-sidebar__link">
              Media Library
            </a>
            <a href="/admin/galleries" className="admin-sidebar__link">
              Galleries
            </a>
          </div>
        </nav>

        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
