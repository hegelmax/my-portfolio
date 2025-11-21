import React, { useEffect, useState } from "react";
import { useRequireAdminAuth } from "../useRequireAdminAuth";

import "./DashboardPage.scss";

type Project = {
  id: number | string;
  title?: string;
  category?: string;
  selected?: boolean | number;
  images?: string[];
};

type GalleryItem = {
  id?: number | string;
  image?: string;
  category?: string;
};

type DashboardState = {
  loading: boolean;
  error: string | null;

  projects: Project[];
  portfolioItems: GalleryItem[];
  publicationsItems: GalleryItem[];
};

const DashboardPage: React.FC = () => {
  const authReady = useRequireAdminAuth();

  const [state, setState] = useState<DashboardState>({
    loading: true,
    error: null,
    projects: [],
    portfolioItems: [],
    publicationsItems: [],
  });

  useEffect(() => {
    // пока не знаем, авторизован ли пользователь — не грузим данные
    if (!authReady) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [projectsRes, portfolioRes, publicationsRes] = await Promise.all([
          fetch("/data/projects.json"),
          fetch("/data/portfolio-items.json"),
          fetch("/data/publications-items.json"),
        ]);

        if (!projectsRes.ok || !portfolioRes.ok || !publicationsRes.ok) {
          throw new Error("Failed to load JSON data");
        }

        const [projectsJson, portfolioJson, publicationsJson] =
          await Promise.all([
            projectsRes.json(),
            portfolioRes.json(),
            publicationsRes.json(),
          ]);

        if (cancelled) return;

        setState({
          loading: false,
          error: null,
          projects: Array.isArray(projectsJson) ? projectsJson : [],
          portfolioItems: Array.isArray(portfolioJson)
            ? portfolioJson
            : [],
          publicationsItems: Array.isArray(publicationsJson)
            ? publicationsJson
            : [],
        });
      } catch (e: any) {
        if (cancelled) return;
        setState((prev) => ({
          ...prev,
          loading: false,
          error: e?.message || "Failed to load dashboard data",
        }));
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [authReady]);

  // все хуки уже вызваны — теперь можно условно рендерить
  if (!authReady) {
    return (
      <div className="admin-dashboard">
        <div className="admin-dashboard__loading">Checking access…</div>
      </div>
    );
  }

  const { loading, error, projects, portfolioItems, publicationsItems } = state;

  const totalProjects = projects.length;
  const totalPortfolioImages = portfolioItems.length;
  const totalPublicationsImages = publicationsItems.length;

  const selectedProjectsCount = projects.filter((p) =>
    typeof p.selected === "boolean"
      ? p.selected
      : typeof p.selected === "number" && p.selected !== 0
  ).length;

  const categoryStats = projects.reduce<Record<string, number>>((acc, p) => {
    const cat = (p.category || "Uncategorized").trim() || "Uncategorized";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const categoryEntries = Object.entries(categoryStats).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  return (
    <div className="admin-dashboard">
      <div className="admin-dashboard__header">
        <div>
          <h1 className="admin-dashboard__title">Overview</h1>
          <p className="admin-dashboard__subtitle">
            Быстрый обзор проектов, портфолио и публикаций.
          </p>
        </div>
        <div className="admin-dashboard__actions">
          <a href="/admin/projects" className="btn-secondary">
            Manage projects
          </a>
          <a href="/admin/portfolio" className="btn-secondary">
            Portfolio gallery
          </a>
          <a href="/admin/publications" className="btn-secondary">
            Publications gallery
          </a>
        </div>
      </div>

      {loading && (
        <div className="admin-dashboard__loading">
          Loading dashboard data…
        </div>
      )}

      {error && !loading && (
        <div className="admin-dashboard__error">{error}</div>
      )}

      {!loading && !error && (
        <>
          <section className="admin-dashboard__cards">
            <article className="metric-card">
              <div className="metric-card__label">Projects</div>
              <div className="metric-card__value">{totalProjects}</div>
              <div className="metric-card__hint">
                {selectedProjectsCount} featured / selected
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-card__label">Portfolio images</div>
              <div className="metric-card__value">{totalPortfolioImages}</div>
              <div className="metric-card__hint">
                From <code>/data/portfolio-items.json</code>
              </div>
            </article>

            <article className="metric-card">
              <div className="metric-card__label">Publications images</div>
              <div className="metric-card__value">
                {totalPublicationsImages}
              </div>
              <div className="metric-card__hint">
                From <code>/data/publications-items.json</code>
              </div>
            </article>
          </section>

          <section className="admin-dashboard__grid">
            <article className="panel">
              <div className="panel__header">
                <h2 className="panel__title">Projects by category</h2>
                <p className="panel__subtitle">
                  Распределение проектов по категориям (например:
                  collection, editorial…)
                </p>
              </div>
              {categoryEntries.length === 0 ? (
                <div className="panel__empty">
                  Нет проектов в projects.json
                </div>
              ) : (
                <table className="panel-table">
                  <thead>
                    <tr>
                      <th>Category</th>
                      <th style={{ textAlign: "right" }}>Projects</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categoryEntries.map(([cat, count]) => (
                      <tr key={cat}>
                        <td>{cat}</td>
                        <td style={{ textAlign: "right" }}>{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </article>

            <article className="panel">
              <div className="panel__header">
                <h2 className="panel__title">Quick notes</h2>
                <p className="panel__subtitle">
                  Черновые подсказки по следующему этапу настройки админки.
                </p>
              </div>
              <ul className="panel-list">
                <li>
                  <strong>Projects</strong> — будут редактироваться на
                  отдельной странице: текст, обложка, галерея и связанные
                  проекты.
                </li>
                <li>
                  <strong>Portfolio gallery</strong> — будет собираться из
                  выбранных папок <code>/img/…</code> с превью фотографий и
                  форматами (1:1, 2:1 и т.д.).
                </li>
                <li>
                  <strong>Publications gallery</strong> — отдельный набор
                  карточек для celebrities / covers.
                </li>
                <li>
                  Следующий шаг — сделать страницу{" "}
                  <code>/admin/projects</code> с таблицей/карточками
                  проектов и модалкой выбора фотографий.
                </li>
              </ul>
            </article>
          </section>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
