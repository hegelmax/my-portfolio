import React, { useEffect, useState } from "react";
import { type Project } from "./AdminProjectsTypes";
import MediaPicker from "../MediaPicker/MediaPicker";

type Props = {
  project: Project | null;
  allProjects: Project[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (project: Project) => void;
};

const emptyProject: Project = {
  title: "",
  subtitle: "",
  slug: "",
  category: "",
  selected: false,
  year: "",
  coverImage: "",
  relatedIds: [],
  summary: "",
  images: [],
};

type RelatedProjectsPickerProps = {
  allProjects: Project[];
  currentId?: number | string;
  value: (number | string)[];
  onChange: (ids: (number | string)[]) => void;
};

const RelatedProjectsPicker: React.FC<RelatedProjectsPickerProps> = ({
  allProjects,
  currentId,
  value,
  onChange,
}) => {
  const idSet = React.useMemo(
    () => new Set(value.map((v) => String(v))),
    [value],
  );

  const handleToggle = (id: number | string) => {
    const idStr = String(id);
    const nextSet = new Set(idSet);

    if (nextSet.has(idStr)) {
      nextSet.delete(idStr);
    } else {
      nextSet.add(idStr);
    }

    const nextIds: (number | string)[] = [];
    allProjects.forEach((p) => {
      if (p.id == null) return;
      const key = String(p.id);
      if (nextSet.has(key) && !nextIds.includes(p.id)) {
        nextIds.push(p.id);
      }
    });

    onChange(nextIds);
  };

  const selectedProjects = allProjects.filter(
    (p) => p.id != null && idSet.has(String(p.id)),
  );

  const selectableProjects = allProjects.filter(
    (p) => p.id !== currentId,
  );

  return (
    <div className="related-picker">
      <div className="field__label-row">
        <span>Related projects</span>
        {selectedProjects.length > 0 && (
          <span className="field__hint">
            {selectedProjects.length} selected
          </span>
        )}
      </div>

      <div className="related-picker__chips">
        {selectedProjects.length === 0 && (
          <span className="related-picker__placeholder">
            No related projects yet
          </span>
        )}
        {selectedProjects.map((p) => (
          <button
            key={p.id}
            type="button"
            className="related-chip"
            onClick={() => p.id != null && handleToggle(p.id)}
          >
            <span className="related-chip__title">{p.title}</span>
            <span className="related-chip__slug">{p.slug}</span>
            <span className="related-chip__remove">✕</span>
          </button>
        ))}
      </div>

      <div className="related-picker__list">
        {selectableProjects.map((p) => {
          if (p.id == null) return null;
          const checked = idSet.has(String(p.id));
          return (
            <label
              key={p.id}
              className={
                "related-picker__item" +
                (checked ? " related-picker__item--checked" : "")
              }
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => handleToggle(p.id!)}
              />
              <div className="related-picker__item-body">
                <div className="related-picker__item-title">{p.title}</div>
                <div className="related-picker__item-slug">{p.slug}</div>
              </div>
            </label>
          );
        })}
      </div>
    </div>
  );
};

export const ProjectEditorModal: React.FC<Props> = ({
  project,
  allProjects,
  saving,
  onCancel,
  onSubmit,
}) => {
  const [draft, setDraft] = useState<Project | null>(
    project
      ? {
          ...emptyProject,
          ...project,
          relatedIds: (project.relatedIds ?? []) as (number | string)[],
          images: (project.images ?? []) as string[],
        }
      : null,
  );

  const [mediaPickerOpen, setMediaPickerOpen] = useState(false);

  useEffect(() => {
    if (!project) {
      setDraft(null);
      return;
    }
    setDraft({
      ...emptyProject,
      ...project,
      relatedIds: (project.relatedIds ?? []) as (number | string)[],
      images: (project.images ?? []) as string[],
    });
  }, [project]);

  if (!draft) return null;

  const handleChangeField = (field: keyof Project, value: any) => {
    setDraft((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    onSubmit(draft);
  };

  return (
    <>
      <div className="projects-modal-backdrop" onClick={onCancel}>
        <div
          className="projects-modal"
          onClick={(e) => e.stopPropagation()}
        >
          <h2 className="projects-modal__title">
            {draft.id ? "Edit project" : "New project"}
          </h2>

          <form className="projects-modal__form" onSubmit={handleSave}>
            <div className="project-form-layout">
              {/* COL 1 — LEFT — FIELDS */}
              <div className="project-form-layout__col project-form-layout__col--left">
                <div className="field">
                  <label>
                    <span>Title</span>
                    <input
                      type="text"
                      value={draft.title}
                      onChange={(e) =>
                        handleChangeField("title", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Subtitle</span>
                    <input
                      type="text"
                      value={draft.subtitle || ""}
                      onChange={(e) =>
                        handleChangeField("subtitle", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Slug</span>
                    <input
                      type="text"
                      value={draft.slug}
                      onChange={(e) =>
                        handleChangeField("slug", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Category</span>
                    <input
                      type="text"
                      value={draft.category || ""}
                      onChange={(e) =>
                        handleChangeField("category", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Date</span>
                    <input
                      type="date"
                      value={draft.date || ""}
                      onChange={(e) =>
                        handleChangeField("date", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Location</span>
                    <input
                      type="text"
                      value={draft.location || ""}
                      onChange={(e) =>
                        handleChangeField("location", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Client</span>
                    <input
                      type="text"
                      value={draft.client || ""}
                      onChange={(e) =>
                        handleChangeField("client", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Author</span>
                    <input
                      type="text"
                      value={draft.author || ""}
                      onChange={(e) =>
                        handleChangeField("author", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field field--inline">
                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={!!draft.selected}
                      onChange={(e) =>
                        handleChangeField("selected", e.target.checked)
                      }
                    />
                    <span className="switch__track">
                      <span className="switch__thumb" />
                    </span>
                    <span className="switch__label">Selected / featured</span>
                  </label>

                  <label className="year-field">
                    <span>Year</span>
                    <input
                      type="text"
                      value={draft.year || ""}
                      onChange={(e) =>
                        handleChangeField("year", e.target.value)
                      }
                    />
                  </label>
                </div>

                <div className="field">
                  <label>
                    <span>Short summary</span>
                    <textarea
                      value={draft.summary || ""}
                      onChange={(e) =>
                        handleChangeField("summary", e.target.value)
                      }
                    />
                  </label>
                </div>

                {/* TAGS */}
                <div className="field">
                  <label>
                    <span>Tags</span>
                    <input
                      type="text"
                      placeholder="Add tag and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (!val) return;
                          handleChangeField("tags", [
                            ...(draft.tags || []),
                            val,
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>

                  {draft.tags && draft.tags.length > 0 && (
                    <div className="chips-row">
                      {draft.tags.map((tag) => (
                        <div
                          key={tag}
                          className="chip"
                          onClick={() =>
                            handleChangeField(
                              "tags",
                              draft.tags!.filter((t) => t !== tag),
                            )
                          }
                        >
                          {tag} <span>✕</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* SERVICES */}
                <div className="field">
                  <label>
                    <span>Services</span>
                    <input
                      type="text"
                      placeholder="Add service and press Enter"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          const val = e.currentTarget.value.trim();
                          if (!val) return;
                          handleChangeField("services", [
                            ...(draft.services || []),
                            val,
                          ]);
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                  </label>

                  {draft.services && draft.services.length > 0 && (
                    <div className="chips-row">
                      {draft.services.map((srv) => (
                        <div
                          key={srv}
                          className="chip"
                          onClick={() =>
                            handleChangeField(
                              "services",
                              draft.services!.filter((s) => s !== srv),
                            )
                          }
                        >
                          {srv} <span>✕</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* DESCRIPTION */}
                <div className="field">
                  <label>
                    <span>Description (paragraphs)</span>
                    <textarea
                      value={(draft.description || []).join("\n\n")}
                      onChange={(e) =>
                        handleChangeField(
                          "description",
                          e.target.value.split(/\n{2,}/),
                        )
                      }
                      rows={6}
                    />
                  </label>
                </div>
              </div>

              {/* COL 2 — CENTER — RELATED PROJECTS */}
              <div className="project-form-layout__col project-form-layout__col--center">
                <RelatedProjectsPicker
                  allProjects={allProjects}
                  currentId={draft.id}
                  value={(draft.relatedIds ?? []) as (number | string)[]}
                  onChange={(ids) =>
                    handleChangeField("relatedIds", ids)
                  }
                />
              </div>

              {/* COL 3 — RIGHT — IMAGES */}
              <div className="project-form-layout__col project-form-layout__col--right">
                <div className="images-block">
                  <div className="field__label-row">
                    <span>Images</span>
                    {draft.images && draft.images.length > 0 && (
                      <span className="field__hint">
                        {draft.images.length} attached
                      </span>
                    )}
                  </div>

                  <div className="project-images-container">
                    {draft.images?.map((img) => (
                      <button
                        key={img}
                        type="button"
                        className={
                          "projects-images-grid__item" +
                          (draft.coverImage === img
                            ? " projects-images-grid__item--cover"
                            : "")
                        }
                        onClick={() =>
                          handleChangeField("coverImage", img)
                        }
                      >
                        <img
                          src={img.replace(/^img\//, "")}
                          className="projects-images-grid__thumb"
                        />

                        <span
                          className="projects-images-grid__remove"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleChangeField(
                              "images",
                              draft.images!.filter((x) => x !== img),
                            );
                            if (draft.coverImage === img) {
                              handleChangeField("coverImage", "");
                            }
                          }}
                        >
                          ✕
                        </span>
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="projects-images-select-btn"
                    onClick={() => setMediaPickerOpen(true)}
                  >
                    <span className="projects-images-select-btn__icon">
                      ＋
                    </span>
                    Select images
                  </button>
                </div>
              </div>
            </div>

            <div className="project-form-footer">
              <button
                type="button"
                className="btn-ghost"
                onClick={onCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving
                  ? "Saving…"
                  : draft.id
                  ? "Save changes"
                  : "Create project"}
              </button>
            </div>
          </form>
        </div>
      </div>

      {mediaPickerOpen && draft && (
        <MediaPicker
          isOpen={mediaPickerOpen}
          onClose={() => setMediaPickerOpen(false)}
          onSelect={(paths) => {
            setDraft((prev) => {
              if (!prev) return prev;
              const prevImages = (prev.images ?? []) as string[];
              const merged = Array.from(
                new Set([...prevImages, ...paths]),
              );

              let nextCover = prev.coverImage || "";
              if (!nextCover && merged.length > 0) {
                nextCover = merged[0];
              }

              return {
                ...prev,
                images: merged,
                coverImage: nextCover,
              };
            });
            setMediaPickerOpen(false);
          }}
        />
      )}
    </>
  );
};
