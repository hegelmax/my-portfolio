import React, { useEffect, useMemo, useState } from "react";
import { useRequireAdminAuth } from "../useRequireAdminAuth";
import { fetchJsonCached } from "../../utils/fetchJsonCached";
import "./SeoPage.scss";

type SeoEntry = {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  og?: {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
};

type SeoConfig = {
  default?: SeoEntry;
  pages?: Record<string, SeoEntry>;
};

type Suggestion = {
  path: string;
  label: string;
  group: "Projects" | "Galleries" | "PDF Works";
};

const emptyEntry: SeoEntry = {
  title: "",
  description: "",
  keywords: "",
  author: "",
  og: {},
  twitter: {},
};

function cloneEntry(entry?: SeoEntry): SeoEntry {
  return {
    ...(entry || {}),
    og: { ...(entry?.og || {}) },
    twitter: { ...(entry?.twitter || {}) },
  };
}

const SeoPage: React.FC = () => {
  const authReady = useRequireAdminAuth();

  const [config, setConfig] = useState<SeoConfig>({ pages: {}, default: {} });
  const [selectedKey, setSelectedKey] = useState<string>("default");
  const [newPath, setNewPath] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const pages = config.pages || {};

  const selectedEntry = useMemo<SeoEntry>(() => {
    if (selectedKey === "default") {
      return cloneEntry(config.default) || cloneEntry(emptyEntry);
    }
    return cloneEntry(pages[selectedKey] || emptyEntry);
  }, [config.default, pages, selectedKey]);

  const pageKeys = useMemo(
    () => Object.keys(pages).sort((a, b) => a.localeCompare(b)),
    [pages],
  );

  const loadConfig = async () => {
    setLoading(true);
    setStatus(null);
    try {
      const resp = await fetch("/api/admin/seo/get", { credentials: "include" });
      const json = await resp.json();
      if (!json?.success) {
        throw new Error(json?.error || "Failed to load SEO config");
      }
      setConfig({
        default: json.data?.default ?? {},
        pages: json.data?.pages ?? {},
      });
      setStatus("Loaded SEO config");
    } catch (err: any) {
      setStatus(err?.message || "Failed to load SEO config");
    } finally {
      setLoading(false);
    }
  };

  const loadSuggestions = async () => {
    try {
      const [projects, galleries, pdf] = await Promise.all([
        fetchJsonCached<any[]>("/data/projects.json").catch(() => []),
        fetchJsonCached<{ galleries: any[] }>("/data/galleries.json").catch(() => ({ galleries: [] })),
        fetchJsonCached<{ works: any[] }>("/data/pdf-works.json").catch(() => ({ works: [] })),
      ]);

      const next: Suggestion[] = [];
      if (Array.isArray(projects)) {
        projects.forEach((p) => {
          if (p?.slug) {
            next.push({
              path: `/projects/${p.slug}`,
              label: `Project: ${p.title || p.slug}`,
              group: "Projects",
            });
          }
        });
      }

      if (Array.isArray(galleries?.galleries)) {
        galleries.galleries.forEach((g) => {
          if (g?.routePath) {
            next.push({
              path: `/${g.routePath}`,
              label: `Gallery: ${g.menuLabel || g.title || g.routePath}`,
              group: "Galleries",
            });
          }
        });
      }

      if (Array.isArray(pdf?.works)) {
        pdf.works.forEach((w) => {
          if (w?.slug) {
            next.push({
              path: `/works/pdf/${w.slug}`,
              label: `PDF Work: ${w.title || w.slug}`,
              group: "PDF Works",
            });
          }
        });
      }

      setSuggestions(next);
    } catch {
      // suggestions are best-effort
    }
  };

  useEffect(() => {
    if (!authReady) return;
    loadConfig();
    loadSuggestions();
  }, [authReady]);

  const ensureEntry = (path: string) => {
    setConfig((prev) => {
      const next: SeoConfig = {
        default: cloneEntry(prev.default || emptyEntry),
        pages: { ...(prev.pages || {}) },
      };
      if (path === "default") {
        next.default = cloneEntry(prev.default || emptyEntry);
      } else {
        next.pages![path] = cloneEntry(prev.pages?.[path] || emptyEntry);
      }
      return next;
    });
  };

  const updateEntry = (path: string, updater: (entry: SeoEntry) => SeoEntry) => {
    setConfig((prev) => {
      const next: SeoConfig = {
        default: cloneEntry(prev.default || emptyEntry),
        pages: { ...(prev.pages || {}) },
      };
      if (path === "default") {
        next.default = updater(cloneEntry(prev.default || emptyEntry));
      } else {
        next.pages![path] = updater(cloneEntry(prev.pages?.[path] || emptyEntry));
      }
      return next;
    });
  };

  const handleAddPath = (path: string) => {
    const trimmed = path.trim();
    if (!trimmed) return;
    ensureEntry(trimmed);
    setSelectedKey(trimmed);
    setNewPath("");
  };

  const handleRemovePath = (path: string) => {
    setConfig((prev) => {
      const nextPages = { ...(prev.pages || {}) };
      delete nextPages[path];
      return { ...prev, pages: nextPages };
    });
    if (selectedKey === path) {
      setSelectedKey("default");
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    try {
      const resp = await fetch("/api/admin/seo/save", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      const json = await resp.json();
      if (!json?.success) {
        throw new Error(json?.error || "Failed to save SEO config");
      }
      setStatus("Saved");
    } catch (err: any) {
      setStatus(err?.message || "Failed to save SEO config");
    } finally {
      setSaving(false);
    }
  };

  const renderInput = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    props?: React.InputHTMLAttributes<HTMLInputElement>,
  ) => (
    <label className="seo-form__field">
      <span>{label}</span>
      <input value={value || ""} onChange={(e) => onChange(e.target.value)} {...props} />
    </label>
  );

  if (!authReady) {
    return <div className="seo-page">Checking access…</div>;
  }

  return (
    <div className="seo-page">
      <div className="seo-page__header">
        <div>
          <h1 className="seo-page__title">SEO</h1>
          <p className="seo-page__subtitle">
            Edit meta tags for default, static pages, projects, galleries, and PDF works.
          </p>
        </div>
        <div className="seo-page__actions">
          <button type="button" className="btn-secondary" onClick={loadConfig} disabled={loading || saving}>
            Refresh
          </button>
          <button type="button" className="btn-primary" onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {status && <div className="seo-page__status">{status}</div>}

      <div className="seo-grid">
        <aside className="seo-sidebar">
          <div className="seo-sidebar__section">
            <div className="seo-sidebar__title">Default</div>
            <button
              className={`seo-sidebar__item${selectedKey === "default" ? " is-active" : ""}`}
              onClick={() => setSelectedKey("default")}
            >
              Default (fallback)
            </button>
          </div>

          <div className="seo-sidebar__section">
            <div className="seo-sidebar__title">Pages</div>
            <div className="seo-sidebar__list">
              {pageKeys.length === 0 && <div className="seo-sidebar__empty">No custom pages</div>}
              {pageKeys.map((key) => (
                <div key={key} className={`seo-sidebar__item-row${selectedKey === key ? " is-active" : ""}`}>
                  <button className="seo-sidebar__item" onClick={() => setSelectedKey(key)}>
                    {key}
                  </button>
                  <button
                    className="seo-sidebar__remove"
                    onClick={() => handleRemovePath(key)}
                    aria-label={`Remove ${key}`}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="seo-sidebar__adder">
              <input
                type="text"
                placeholder="Add path, e.g. /projects/slug"
                value={newPath}
                onChange={(e) => setNewPath(e.target.value)}
              />
              <button type="button" onClick={() => handleAddPath(newPath)}>Add</button>
            </div>

            {suggestions.length > 0 && (
              <div className="seo-sidebar__suggestions">
                <div className="seo-sidebar__title">Suggestions</div>
                {["Projects", "Galleries", "PDF Works"].map((group) => (
                  <div key={group}>
                    <div className="seo-sidebar__subtitle">{group}</div>
                    <ul>
                      {suggestions
                        .filter((s) => s.group === group)
                        .map((s) => (
                          <li key={s.path}>
                            <button type="button" onClick={() => handleAddPath(s.path)}>
                              {s.label} <span className="seo-sidebar__path">{s.path}</span>
                            </button>
                          </li>
                        ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>

        <section className="seo-form">
          <div className="seo-form__section">
            <h2>{selectedKey === "default" ? "Default (fallback)" : `Page: ${selectedKey}`}</h2>
            <div className="seo-form__grid">
              {renderInput("Title", selectedEntry.title || "", (v) => updateEntry(selectedKey, (e) => ({ ...e, title: v })))}
              {renderInput("Keywords", selectedEntry.keywords || "", (v) => updateEntry(selectedKey, (e) => ({ ...e, keywords: v })))}
              {renderInput("Author", selectedEntry.author || "", (v) => updateEntry(selectedKey, (e) => ({ ...e, author: v })))}
            </div>
            <label className="seo-form__field">
              <span>Description</span>
              <textarea
                value={selectedEntry.description || ""}
                onChange={(e) =>
                  updateEntry(selectedKey, (entry) => ({ ...entry, description: e.target.value }))
                }
                rows={3}
              />
            </label>
          </div>

          <div className="seo-form__section">
            <h3>Open Graph</h3>
            <div className="seo-form__grid">
              {renderInput("OG Title", selectedEntry.og?.title || "", (v) =>
                updateEntry(selectedKey, (e) => ({ ...e, og: { ...(e.og || {}), title: v } }))
              )}
              {renderInput("OG Type", selectedEntry.og?.type || "", (v) =>
                updateEntry(selectedKey, (e) => ({ ...e, og: { ...(e.og || {}), type: v } }))
              )}
              {renderInput("OG URL", selectedEntry.og?.url || "", (v) =>
                updateEntry(selectedKey, (e) => ({ ...e, og: { ...(e.og || {}), url: v } }))
              )}
            </div>
            <label className="seo-form__field">
              <span>OG Description</span>
              <textarea
                value={selectedEntry.og?.description || ""}
                onChange={(e) =>
                  updateEntry(selectedKey, (entry) => ({
                    ...entry,
                    og: { ...(entry.og || {}), description: e.target.value },
                  }))
                }
                rows={2}
              />
            </label>
            {renderInput("OG Image", selectedEntry.og?.image || "", (v) =>
              updateEntry(selectedKey, (e) => ({ ...e, og: { ...(e.og || {}), image: v } }))
            )}
          </div>

          <div className="seo-form__section">
            <h3>Twitter</h3>
            <div className="seo-form__grid">
              {renderInput("Card", selectedEntry.twitter?.card || "", (v) =>
                updateEntry(selectedKey, (e) => ({ ...e, twitter: { ...(e.twitter || {}), card: v } }))
              )}
              {renderInput("Title", selectedEntry.twitter?.title || "", (v) =>
                updateEntry(selectedKey, (e) => ({ ...e, twitter: { ...(e.twitter || {}), title: v } }))
              )}
            </div>
            <label className="seo-form__field">
              <span>Description</span>
              <textarea
                value={selectedEntry.twitter?.description || ""}
                onChange={(e) =>
                  updateEntry(selectedKey, (entry) => ({
                    ...entry,
                    twitter: { ...(entry.twitter || {}), description: e.target.value },
                  }))
                }
                rows={2}
              />
            </label>
            {renderInput("Image", selectedEntry.twitter?.image || "", (v) =>
              updateEntry(selectedKey, (e) => ({ ...e, twitter: { ...(e.twitter || {}), image: v } }))
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SeoPage;
