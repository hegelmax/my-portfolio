import React, { useEffect, useState } from "react";
import { useRequireAdminAuth } from "../useRequireAdminAuth";
import { fetchJsonCached } from "../../utils/fetchJsonCached";

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
    // while auth status is unknown, do not load data
    if (!authReady) return;

    let cancelled = false;

    const load = async () => {
      try {
        const [projectsRes, portfolioRes, publicationsRes] = await Promise.all([
          fetchJsonCached("/data/projects.json"),
          fetchJsonCached("/data/portfolio-items.json"),
          fetchJsonCached("/data/publications-items.json"),
        ]);

        const [projectsJson, portfolioJson, publicationsJson] = [
          projectsRes,
          portfolioRes,
          publicationsRes,
        ];

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

  // all hooks already called - can conditionally render now
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
            Quick overview of projects, portfolio, and publications.
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
                  Distribution of projects by category (e.g., collection, editorial)
                </p>
              </div>
              {categoryEntries.length === 0 ? (
                <div className="panel__empty">
                  No projects in projects.json
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
                  Draft notes for the next admin setup steps.
                </p>
              </div>
              <ul className="panel-list">
                <li>
                  <strong>Projects</strong> - will be edited on a dedicated page: text, cover, gallery, and related projects.
                </li>
                <li>
                  <strong>Portfolio gallery</strong> — will be built from
                  selected folders <code>/img/…</code> with photo previews and
                  formats (1:1, 2:1, etc.).
                </li>
                <li>
                  <strong>Publications gallery</strong> — separate set of
                  cards for celebrities / covers.
                </li>
                <li>
                  Next step - build{" "}
                  <code>/admin/projects</code> with table/cards
                  of projects and a photo picker modal.
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



