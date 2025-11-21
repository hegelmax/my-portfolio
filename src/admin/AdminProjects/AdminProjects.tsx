import React, { useEffect, useState } from "react";
import { useRequireAdminAuth } from "../useRequireAdminAuth";

import { type Project, type ProjectsState } from "./AdminProjectsTypes";
import { ProjectsTable } from "./ProjectsTable";
import { ProjectEditorModal } from "./ProjectEditorModal";

import "./AdminProjects.scss";

const emptyProject: Project = {
  title: "",
  subtitle: "",
  slug: "",
  category: "",
  selected: false,

  date: "",
  location: "",
  client: "",
  author: "",

  tags: [],
  services: [],
  description: [],

  year: "",
  summary: "",

  coverImage: "",
  images: [],

  relatedIds: [],
  relatedSlugs: [],
};


const AdminProjects: React.FC = () => {
  const authReady = useRequireAdminAuth();

  const [state, setState] = useState<ProjectsState>({
    loading: true,
    error: null,
    items: [],
  });

  const [editing, setEditing] = useState<Project | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | string | null>(null);

  // загрузка списка проектов
  useEffect(() => {
    if (!authReady) return;

    let cancelled = false;

    const load = async () => {
      try {
        const resp = await fetch("/api/admin/projects/list", {
          credentials: "include",
        });
        const data = await resp.json();
        if (cancelled) return;

        if (!data.success) {
          throw new Error(data.error || "Failed to load projects");
        }

        setState({
          loading: false,
          error: null,
          items: Array.isArray(data.items) ? data.items : [],
        });
      } catch (e: any) {
        if (cancelled) return;
        setState({
          loading: false,
          error: e?.message || "Failed to load projects",
          items: [],
        });
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  if (!authReady) {
    return (
      <div className="projects-page">
        <div className="projects-page__loading">Checking access…</div>
      </div>
    );
  }

  const { loading, error, items } = state;

  const handleNew = () => {
    setEditing({ ...emptyProject });
  };

  const handleEdit = (p: Project) => {
    setEditing({
      ...emptyProject,
      ...p,
      relatedIds: (p.relatedIds ?? []) as (number | string)[],
      images: (p.images ?? []) as string[],
    });
  };

  const handleCancelEdit = () => {
    setEditing(null);
  };

  const handleSaveProject = async (project: Project) => {
    setSaving(true);
    try {
      const resp = await fetch("/api/admin/projects/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(project),
      });

      const data = await resp.json();
      if (!data.success) {
        throw new Error(
          (data.errors && data.errors.join(", ")) || "Failed to save project"
        );
      }

      const newItems: Project[] = Array.isArray(data.items)
        ? data.items
        : items;

      setState((prev) => ({
        ...prev,
        items: newItems,
        error: null,
      }));
      setEditing(null);
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        error: e?.message || "Failed to save project",
      }));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (project: Project) => {
    if (!project.id) return;
    if (!window.confirm(`Delete project "${project.title}"?`)) return;

    setDeletingId(project.id);
    try {
      const resp = await fetch("/api/admin/projects/delete", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: project.id }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(
          (data.errors && data.errors.join(", ")) || "Failed to delete project"
        );
      }

      const newItems: Project[] = Array.isArray(data.items)
        ? data.items
        : items;

      setState((prev) => ({
        ...prev,
        items: newItems,
        error: null,
      }));
    } catch (e: any) {
      setState((prev) => ({
        ...prev,
        error: e?.message || "Failed to delete project",
      }));
    } finally {
      setDeletingId(null);
    }
  };

  const sortedItems = [...items].sort((a, b) => {
    const aTitle = (a.title || "").toLowerCase();
    const bTitle = (b.title || "").toLowerCase();
    return aTitle.localeCompare(bTitle);
  });

  return (
    <div className="projects-page">
      <div className="projects-page__header">
        <div>
          <h1 className="projects-page__title">Projects</h1>
          <p className="projects-page__subtitle">
            Управление карточками проектов: название, slug, категория, флаг
            selected, обложка и галерея.
          </p>
        </div>
        <div>
          <button
            type="button"
            className="btn-primary"
            onClick={handleNew}
          >
            New project
          </button>
        </div>
      </div>

      {loading && (
        <div className="projects-page__loading">Loading projects…</div>
      )}

      {error && !loading && (
        <div className="projects-page__error">{error}</div>
      )}

      {!loading && !error && sortedItems.length === 0 && (
        <div className="projects-page__empty">
          No projects yet. Click <strong>New project</strong> to create one.
        </div>
      )}

      {!loading && !error && sortedItems.length > 0 && (
        <ProjectsTable
          items={sortedItems}
          deletingId={deletingId}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      {/* Модалка редактирования — теперь отдельный компонент */}
      <ProjectEditorModal
        project={editing}
        allProjects={items}
        saving={saving}
        onCancel={handleCancelEdit}
        onSubmit={handleSaveProject}
      />
    </div>
  );
};

export default AdminProjects;
