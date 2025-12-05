import React, { useEffect, useState } from "react";
import { useRequireAdminAuth } from "../useRequireAdminAuth";
import type {
  GalleryConfig,
  GalleryFilterConfig,
  GalleryFilterClause,
} from "../../types/galleries";
import GalleryFiltersTable from "./components/GalleryFiltersTable";
import type {
  ClauseInputType,
  DragFilterState,
  UpdateClauseDataFn,
  UpdateGalleryFn,
} from "./types";

import "./GalleriesPage.scss";

const uid = () => Math.random().toString(36).slice(2);

const createClause = (): GalleryFilterClause => ({
  id: uid(),
  mode: "ANY",
  tags: [],
  excludeTags: [],
});

const createFilter = (): GalleryFilterConfig => ({
  id: `filter-${uid()}`,
  label: "New filter",
  showInMenu: true,
  clauses: [createClause()],
});

const createGallery = (): GalleryConfig => {
  const defaultFilter = {
    id: "all",
    label: "All",
    showInMenu: true,
    clauses: [],
  };
  return {
    id: `gallery-${uid()}`,
    routePath: "",
    title: "New gallery",
    subtitle: "",
    menuLabel: "",
    defaultFilterId: defaultFilter.id,
    filters: [defaultFilter],
  };
};

const GalleriesPage: React.FC = () => {
  const authReady = useRequireAdminAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [galleries, setGalleries] = useState<GalleryConfig[]>([]);
  const [clauseInputs, setClauseInputs] = useState<Record<string, string>>({});
  const [editingFilterId, setEditingFilterId] = useState<string | null>(null);
  const [dragFilterState, setDragFilterState] = useState<DragFilterState>(null);

  const load = async () => {
    try {
      setLoading(true);
      const resp = await fetch("/api/admin/galleries/list");
      if (!resp.ok) throw new Error("Failed to load galleries");
      const data = await resp.json();
      setGalleries(Array.isArray(data.galleries) ? data.galleries : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load galleries");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authReady) {
      load();
    }
  }, [authReady]);

  const updateGallery: UpdateGalleryFn = (
    index: number,
    updater: (gallery: GalleryConfig) => GalleryConfig,
  ) => {
    setGalleries((prev) => {
      const next = [...prev];
      next[index] = updater({ ...next[index] });
      return next;
    });
  };

  const updateClauseData: UpdateClauseDataFn = (
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    updater: (clause: GalleryFilterClause) => GalleryFilterClause,
  ) => {
    updateGallery(galleryIndex, (gallery) => {
      const filters = [...gallery.filters];
      const clauses = [...filters[filterIndex].clauses];
      clauses[clauseIndex] = updater({ ...clauses[clauseIndex] });
      filters[filterIndex] = { ...filters[filterIndex], clauses };
      return { ...gallery, filters };
    });
  };

  const updateClauseInput = (key: string, value: string) => {
    setClauseInputs((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleAddFilter = (galleryIndex: number) => {
    const newFilter = createFilter();
    updateGallery(galleryIndex, (curr) => ({
      ...curr,
      filters: [...curr.filters, newFilter],
    }));
    setEditingFilterId(newFilter.id);
  };

  const handleRemoveFilter = (galleryIndex: number, filterIndex: number) => {
    const targetFilter = galleries[galleryIndex]?.filters[filterIndex];
    updateGallery(galleryIndex, (curr) => ({
      ...curr,
      filters: curr.filters.filter((_, i) => i !== filterIndex),
    }));
    if (targetFilter && editingFilterId === targetFilter.id) {
      setEditingFilterId(null);
    }
  };

  const handleFilterDragStart = (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
    filterIndex: number,
  ) => {
    e.dataTransfer.effectAllowed = "move";
    setDragFilterState({ galleryIndex, filterIndex });
  };

  const handleFilterDragOver = (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
  ) => {
    if (!dragFilterState || dragFilterState.galleryIndex !== galleryIndex) {
      return;
    }
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleFilterDrop = (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
    filterIndex: number,
  ) => {
    if (!dragFilterState || dragFilterState.galleryIndex !== galleryIndex) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const bounds = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const placeAfter = e.clientY - bounds.top > bounds.height / 2;
    const fromIndex = dragFilterState.filterIndex;
    let insertAt = placeAfter ? filterIndex + 1 : filterIndex;
    if (fromIndex < insertAt) {
      insertAt -= 1;
    }
    if (insertAt === fromIndex) {
      setDragFilterState(null);
      return;
    }
    updateGallery(galleryIndex, (curr) => {
      const nextFilters = [...curr.filters];
      const [moved] = nextFilters.splice(fromIndex, 1);
      nextFilters.splice(insertAt, 0, moved);
      return { ...curr, filters: nextFilters };
    });
    setDragFilterState(null);
  };

  const handleFilterListDrop = (
    e: React.DragEvent<HTMLDivElement>,
    galleryIndex: number,
  ) => {
    if (
      !dragFilterState ||
      dragFilterState.galleryIndex !== galleryIndex ||
      e.currentTarget !== e.target
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    const fromIndex = dragFilterState.filterIndex;
    updateGallery(galleryIndex, (curr) => {
      const nextFilters = [...curr.filters];
      const [moved] = nextFilters.splice(fromIndex, 1);
      nextFilters.push(moved);
      return { ...curr, filters: nextFilters };
    });
    setDragFilterState(null);
  };

  const handleFilterDragEnd = () => {
    setDragFilterState(null);
  };

  const getInputKey = (clauseId: string, type: ClauseInputType) =>
    `${clauseId}-${type}`;

  const addClauseTags = (
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    type: ClauseInputType,
    rawTags: string[],
  ) => {
    const trimmed = rawTags
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);
    if (trimmed.length === 0) return;

    updateClauseData(
      galleryIndex,
      filterIndex,
      clauseIndex,
      (clause) => {
        const existing = new Set(
          (clause[type] ?? []).map((tag) => tag.toLowerCase()),
        );
        const nextTags = [...(clause[type] ?? [])];
        trimmed.forEach((tag) => {
          const lower = tag.toLowerCase();
          if (existing.has(lower)) return;
          existing.add(lower);
          nextTags.push(tag);
        });
        return {
          ...clause,
          [type]: nextTags,
        };
      },
    );
  };

  const removeClauseTag = (
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    type: ClauseInputType,
    tagToRemove: string,
  ) => {
    updateClauseData(
      galleryIndex,
      filterIndex,
      clauseIndex,
      (clause) => ({
        ...clause,
        [type]: (clause[type] ?? []).filter((tag) => tag !== tagToRemove),
      }),
    );
  };

  const handleClauseInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const key = getInputKey(clauseId, type);
    const value = (clauseInputs[key] ?? "").trim();
    if (!value) return;
    addClauseTags(galleryIndex, filterIndex, clauseIndex, type, [value]);
    updateClauseInput(key, "");
  };

  const handleClauseInputPaste = (
    event: React.ClipboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => {
    const text = event.clipboardData.getData("text");
    if (!text) return;
    event.preventDefault();
    const tags = text
      .split(/[,;\n\r]+/)
      .map((tag) => tag.trim())
      .filter(Boolean);
    addClauseTags(galleryIndex, filterIndex, clauseIndex, type, tags);
    const key = getInputKey(clauseId, type);
    updateClauseInput(key, "");
  };

  const handleSave = async () => {
    setSaving(true);
    setStatus(null);
    setError(null);
    try {
      const resp = await fetch("/api/admin/galleries/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ galleries }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to save galleries");
      }
      setStatus("Galleries saved");
    } catch (e: any) {
      setError(e?.message || "Failed to save galleries");
    } finally {
      setSaving(false);
    }
  };

  if (!authReady) {
    return <div className="galleries-page">Checking access...</div>;
  }

  return (
    <div className="galleries-page">
      <div className="galleries-page__header">
        <div>
          <h1>Galleries</h1>
          <p>Manage gallery routes, filters and tag rules.</p>
        </div>
        <div className="galleries-page__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setGalleries((prev) => [...prev, createGallery()])}
          >
            + Add gallery
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={saving}
            onClick={handleSave}
          >
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {error && <div className="galleries-page__error">{error}</div>}
      {status && <div className="galleries-page__status">{status}</div>}

      {loading ? (
        <div className="galleries-page__loading">Loading galleries...</div>
      ) : (
        <div className="galleries-page__list">
          {galleries.map((gallery, index) => (
            <section key={gallery.id} className="gallery-card">
              <div className="gallery-card__header">
                <h2>{gallery.title || gallery.id}</h2>
                <button
                  type="button"
                  className="gallery-card__remove"
                  onClick={() =>
                    setGalleries((prev) => prev.filter((_, i) => i !== index))
                  }
                >
                  Delete
                </button>
              </div>

              <div className="gallery-card__grid">
                <label>
                  Slug
                  <input
                    value={gallery.id}
                    onChange={(e) =>
                      updateGallery(index, (curr) => ({ ...curr, id: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Route path
                  <input
                    value={gallery.routePath}
                    onChange={(e) =>
                      updateGallery(index, (curr) => ({
                        ...curr,
                        routePath: e.target.value.replace(/^\/+/, ""),
                      }))
                    }
                    placeholder="portfolio"
                  />
                </label>
                <label>
                  Title
                  <input
                    value={gallery.title}
                    onChange={(e) =>
                      updateGallery(index, (curr) => ({ ...curr, title: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Menu label
                  <input
                    value={gallery.menuLabel}
                    onChange={(e) =>
                      updateGallery(index, (curr) => ({ ...curr, menuLabel: e.target.value }))
                    }
                    placeholder="Portfolio"
                  />
                </label>
                <label className="gallery-card__full">
                  Subtitle
                  <input
                    value={gallery.subtitle}
                    onChange={(e) =>
                      updateGallery(index, (curr) => ({ ...curr, subtitle: e.target.value }))
                    }
                  />
                </label>
                <label>
                  Default filter
                  <select
                    value={gallery.defaultFilterId}
                    onChange={(e) =>
                      updateGallery(index, (curr) => ({
                        ...curr,
                        defaultFilterId: e.target.value,
                      }))
                    }
                  >
                    {gallery.filters.map((filter) => (
                      <option key={filter.id} value={filter.id}>
                        {filter.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="gallery-card__filters">
                <div className="gallery-card__filters-header">
                  <h3>Filters</h3>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => handleAddFilter(index)}
                  >
                    + Add filter
                  </button>
                </div>

                <GalleryFiltersTable
                  gallery={gallery}
                  galleryIndex={index}
                  editingFilterId={editingFilterId}
                  dragFilterState={dragFilterState}
                  clauseInputs={clauseInputs}
                  setEditingFilterId={setEditingFilterId}
                  updateGallery={updateGallery}
                  updateClauseData={updateClauseData}
                  removeClauseTag={removeClauseTag}
                  getInputKey={getInputKey}
                  updateClauseInput={updateClauseInput}
                  handleClauseInputKeyDown={handleClauseInputKeyDown}
                  handleClauseInputPaste={handleClauseInputPaste}
                  handleFilterDragStart={handleFilterDragStart}
                  handleFilterDragOver={handleFilterDragOver}
                  handleFilterDrop={handleFilterDrop}
                  handleFilterListDrop={handleFilterListDrop}
                  handleFilterDragEnd={handleFilterDragEnd}
                  handleRemoveFilter={handleRemoveFilter}
                  createClause={createClause}
                />
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleriesPage;

