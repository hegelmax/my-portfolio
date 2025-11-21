import React from "react";
import type {
  GalleryConfig,
  GalleryFilterClause,
  GalleryFilterConfig,
} from "../../../types/galleries";
import type {
  ClauseInputType,
  DragFilterState,
  UpdateClauseDataFn,
  UpdateGalleryFn,
} from "../types";

type GalleryFiltersTableProps = {
  gallery: GalleryConfig;
  galleryIndex: number;
  editingFilterId: string | null;
  dragFilterState: DragFilterState;
  clauseInputs: Record<string, string>;
  setEditingFilterId: (id: string | null) => void;
  updateGallery: UpdateGalleryFn;
  updateClauseData: UpdateClauseDataFn;
  removeClauseTag: (
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    type: ClauseInputType,
    tagToRemove: string,
  ) => void;
  getInputKey: (clauseId: string, type: ClauseInputType) => string;
  updateClauseInput: (key: string, value: string) => void;
  handleClauseInputKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
  handleClauseInputPaste: (
    event: React.ClipboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
  handleFilterDragStart: (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
    filterIndex: number,
  ) => void;
  handleFilterDragOver: (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
  ) => void;
  handleFilterDrop: (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
    filterIndex: number,
  ) => void;
  handleFilterListDrop: (
    e: React.DragEvent<HTMLDivElement>,
    galleryIndex: number,
  ) => void;
  handleFilterDragEnd: () => void;
  handleRemoveFilter: (galleryIndex: number, filterIndex: number) => void;
  createClause: () => GalleryFilterClause;
};

const GalleryFiltersTable: React.FC<GalleryFiltersTableProps> = ({
  gallery,
  galleryIndex,
  editingFilterId,
  dragFilterState,
  clauseInputs,
  setEditingFilterId,
  updateGallery,
  updateClauseData,
  removeClauseTag,
  getInputKey,
  updateClauseInput,
  handleClauseInputKeyDown,
  handleClauseInputPaste,
  handleFilterDragStart,
  handleFilterDragOver,
  handleFilterDrop,
  handleFilterListDrop,
  handleFilterDragEnd,
  handleRemoveFilter,
  createClause,
}) => {
  return (
    <div
      className="gallery-filters-table"
      onDragOver={(e) => handleFilterDragOver(e, galleryIndex)}
      onDrop={(e) => handleFilterListDrop(e, galleryIndex)}
    >
      {gallery.filters.map((filter, filterIndex) => (
        <GalleryFilterRow
          key={filter.id}
          galleryIndex={galleryIndex}
          filterIndex={filterIndex}
          filter={filter}
          isEditing={editingFilterId === filter.id}
          isDragging={
            dragFilterState?.galleryIndex === galleryIndex &&
            dragFilterState?.filterIndex === filterIndex
          }
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
          handleFilterDragEnd={handleFilterDragEnd}
          handleRemoveFilter={handleRemoveFilter}
          createClause={createClause}
          isDefault={gallery.defaultFilterId === filter.id}
        />
      ))}
    </div>
  );
};

type GalleryFilterRowProps = {
  galleryIndex: number;
  filterIndex: number;
  filter: GalleryFilterConfig;
  isEditing: boolean;
  isDragging: boolean;
  clauseInputs: Record<string, string>;
  setEditingFilterId: (id: string | null) => void;
  updateGallery: UpdateGalleryFn;
  updateClauseData: UpdateClauseDataFn;
  removeClauseTag: (
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    type: ClauseInputType,
    tagToRemove: string,
  ) => void;
  getInputKey: (clauseId: string, type: ClauseInputType) => string;
  updateClauseInput: (key: string, value: string) => void;
  handleClauseInputKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
  handleClauseInputPaste: (
    event: React.ClipboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
  handleFilterDragStart: (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
    filterIndex: number,
  ) => void;
  handleFilterDragOver: (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
  ) => void;
  handleFilterDrop: (
    e: React.DragEvent<HTMLElement>,
    galleryIndex: number,
    filterIndex: number,
  ) => void;
  handleFilterDragEnd: () => void;
  handleRemoveFilter: (galleryIndex: number, filterIndex: number) => void;
  createClause: () => GalleryFilterClause;
  isDefault: boolean;
};

const GalleryFilterRow: React.FC<GalleryFilterRowProps> = ({
  galleryIndex,
  filterIndex,
  filter,
  isEditing,
  isDragging,
  clauseInputs,
  setEditingFilterId,
  updateGallery,
  updateClauseData,
  removeClauseTag,
  getInputKey,
  updateClauseInput,
  handleClauseInputKeyDown,
  handleClauseInputPaste,
  handleFilterDragStart,
  handleFilterDragOver,
  handleFilterDrop,
  handleFilterDragEnd,
  handleRemoveFilter,
  createClause,
  isDefault,
}) => {
  const clauseCount = filter.clauses?.length ?? 0;
  return (
    <div
      className={`gallery-filter-row${
        isEditing ? " is-expanded" : ""
      }${isDragging ? " is-dragging" : ""}`}
      onDragOver={(e) => handleFilterDragOver(e, galleryIndex)}
      onDrop={(e) => handleFilterDrop(e, galleryIndex, filterIndex)}
    >
      <div className="gallery-filter-row__summary">
        <button
          type="button"
          className="gallery-filter-row__drag-handle"
          draggable
          onDragStart={(e) => handleFilterDragStart(e, galleryIndex, filterIndex)}
          onDragEnd={handleFilterDragEnd}
          aria-label="Reorder filter"
        >
          <span aria-hidden="true">::</span>
        </button>
        <div className="gallery-filter-row__summary-main">
          <div className="gallery-filter-row__title">
            <span>{filter.label}</span>
            {isDefault && (
              <span className="gallery-filter-row__badge">Default</span>
            )}
            {!filter.showInMenu && (
              <span className="gallery-filter-row__badge gallery-filter-row__badge--muted">
                Hidden
              </span>
            )}
          </div>
          <div className="gallery-filter-row__meta">
            <span>ID: {filter.id}</span>
            <span>
              {clauseCount === 0
                ? "No rules"
                : `${clauseCount} ${clauseCount === 1 ? "rule" : "rules"}`}
            </span>
          </div>
        </div>
        <div className="gallery-filter-row__actions">
          <button
            type="button"
            className="btn-secondary"
            onClick={() => setEditingFilterId(isEditing ? null : filter.id)}
          >
            {isEditing ? "Close" : "Edit"}
          </button>
          <button
            type="button"
            className="gallery-filter-row__remove"
            onClick={() => handleRemoveFilter(galleryIndex, filterIndex)}
          >
            Remove
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="gallery-filter-row__editor">
          <div className="gallery-filter__fields">
            <label>
              Label
              <input
                value={filter.label}
                onChange={(e) =>
                  updateGallery(galleryIndex, (curr) => {
                    const nextFilters = [...curr.filters];
                    nextFilters[filterIndex] = {
                      ...nextFilters[filterIndex],
                      label: e.target.value,
                    };
                    return { ...curr, filters: nextFilters };
                  })
                }
              />
            </label>
            <label>
              ID
              <input
                value={filter.id}
                onChange={(e) =>
                  updateGallery(galleryIndex, (curr) => {
                    const nextFilters = [...curr.filters];
                    nextFilters[filterIndex] = {
                      ...nextFilters[filterIndex],
                      id: e.target.value,
                    };
                    return { ...curr, filters: nextFilters };
                  })
                }
              />
            </label>
            <label className="gallery-filter__checkbox">
              <input
                type="checkbox"
                checked={filter.showInMenu}
                onChange={(e) =>
                  updateGallery(galleryIndex, (curr) => {
                    const nextFilters = [...curr.filters];
                    nextFilters[filterIndex] = {
                      ...nextFilters[filterIndex],
                      showInMenu: e.target.checked,
                    };
                    return { ...curr, filters: nextFilters };
                  })
                }
              />
              Show in menu
            </label>
          </div>

          <GalleryClausesEditor
            galleryIndex={galleryIndex}
            filterIndex={filterIndex}
            filter={filter}
            clauseInputs={clauseInputs}
            updateGallery={updateGallery}
            updateClauseData={updateClauseData}
            removeClauseTag={removeClauseTag}
            getInputKey={getInputKey}
            updateClauseInput={updateClauseInput}
            handleClauseInputKeyDown={handleClauseInputKeyDown}
            handleClauseInputPaste={handleClauseInputPaste}
            createClause={createClause}
          />
        </div>
      )}
    </div>
  );
};

type GalleryClausesEditorProps = {
  galleryIndex: number;
  filterIndex: number;
  filter: GalleryFilterConfig;
  clauseInputs: Record<string, string>;
  updateGallery: UpdateGalleryFn;
  updateClauseData: UpdateClauseDataFn;
  removeClauseTag: (
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    type: ClauseInputType,
    tagToRemove: string,
  ) => void;
  getInputKey: (clauseId: string, type: ClauseInputType) => string;
  updateClauseInput: (key: string, value: string) => void;
  handleClauseInputKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
  handleClauseInputPaste: (
    event: React.ClipboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
  createClause: () => GalleryFilterClause;
};

const GalleryClausesEditor: React.FC<GalleryClausesEditorProps> = ({
  galleryIndex,
  filterIndex,
  filter,
  clauseInputs,
  updateGallery,
  updateClauseData,
  removeClauseTag,
  getInputKey,
  updateClauseInput,
  handleClauseInputKeyDown,
  handleClauseInputPaste,
  createClause,
}) => {
  const clauses = filter.clauses ?? [];
  return (
    <div className="gallery-clauses">
      <div className="gallery-clauses__header">
        <strong>Rules</strong>
        <button
          type="button"
          className="btn-secondary"
          onClick={() =>
            updateGallery(galleryIndex, (curr) => {
              const nextFilters = [...curr.filters];
              nextFilters[filterIndex] = {
                ...nextFilters[filterIndex],
                clauses: [...(nextFilters[filterIndex].clauses ?? []), createClause()],
              };
              return { ...curr, filters: nextFilters };
            })
          }
        >
          + Add clause
        </button>
      </div>

      {clauses.length === 0 && (
        <p className="gallery-clauses__empty">
          This filter inherits the pool of all configured filters in the gallery.
        </p>
      )}

      {clauses.map((clause, clauseIndex) => (
        <div key={clause.id} className="gallery-clause">
          <label>
            Mode
            <select
              value={clause.mode}
              onChange={(e) =>
                updateClauseData(galleryIndex, filterIndex, clauseIndex, (currClause) => ({
                  ...currClause,
                  mode: e.target.value as GalleryFilterClause["mode"],
                }))
              }
            >
              <option value="ANY">ANY (OR)</option>
              <option value="ALL">ALL (AND)</option>
              <option value="NOT">NOT</option>
            </select>
          </label>

          <ClauseTagsInput
            title="Tags"
            placeholder="Add tag"
            clause={clause}
            clauseIndex={clauseIndex}
            galleryIndex={galleryIndex}
            filterIndex={filterIndex}
            clauseInputs={clauseInputs}
            type="tags"
            removeClauseTag={removeClauseTag}
            getInputKey={getInputKey}
            updateClauseInput={updateClauseInput}
            handleClauseInputKeyDown={handleClauseInputKeyDown}
            handleClauseInputPaste={handleClauseInputPaste}
          />

          <ClauseTagsInput
            title="Exclude tags"
            placeholder="Add exclude tag"
            clause={clause}
            clauseIndex={clauseIndex}
            galleryIndex={galleryIndex}
            filterIndex={filterIndex}
            clauseInputs={clauseInputs}
            type="excludeTags"
            removeClauseTag={removeClauseTag}
            getInputKey={getInputKey}
            updateClauseInput={updateClauseInput}
            handleClauseInputKeyDown={handleClauseInputKeyDown}
            handleClauseInputPaste={handleClauseInputPaste}
          />

          <button
            type="button"
            className="gallery-clause__remove"
            onClick={() =>
              updateGallery(galleryIndex, (curr) => {
                const nextFilters = [...curr.filters];
                const nextClauses = (nextFilters[filterIndex].clauses ?? []).filter(
                  (_, i) => i !== clauseIndex,
                );
                nextFilters[filterIndex] = {
                  ...nextFilters[filterIndex],
                  clauses: nextClauses,
                };
                return { ...curr, filters: nextFilters };
              })
            }
          >
            Remove clause
          </button>
        </div>
      ))}
    </div>
  );
};

type ClauseTagsInputProps = {
  title: string;
  placeholder: string;
  clause: GalleryFilterClause;
  clauseIndex: number;
  galleryIndex: number;
  filterIndex: number;
  clauseInputs: Record<string, string>;
  type: ClauseInputType;
  removeClauseTag: (
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    type: ClauseInputType,
    tagToRemove: string,
  ) => void;
  getInputKey: (clauseId: string, type: ClauseInputType) => string;
  updateClauseInput: (key: string, value: string) => void;
  handleClauseInputKeyDown: (
    event: React.KeyboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
  handleClauseInputPaste: (
    event: React.ClipboardEvent<HTMLInputElement>,
    galleryIndex: number,
    filterIndex: number,
    clauseIndex: number,
    clauseId: string,
    type: ClauseInputType,
  ) => void;
};

const ClauseTagsInput: React.FC<ClauseTagsInputProps> = ({
  title,
  placeholder,
  clause,
  clauseIndex,
  galleryIndex,
  filterIndex,
  clauseInputs,
  type,
  removeClauseTag,
  getInputKey,
  updateClauseInput,
  handleClauseInputKeyDown,
  handleClauseInputPaste,
}) => {
  const tags = clause[type] ?? [];
  const inputKey = getInputKey(clause.id, type);

  return (
    <div className="gallery-clause__tags">
      <span className="gallery-clause__tags-label">{title}</span>
      <div className="gallery-clause__tags-list">
        {tags.length === 0 && <span className="gallery-tag-placeholder">None</span>}
        {tags.map((tag) => (
          <span key={tag} className="gallery-tag-chip">
            <span>#{tag}</span>
            <button
              type="button"
              onClick={() =>
                removeClauseTag(galleryIndex, filterIndex, clauseIndex, type, tag)
              }
            >
              ×
            </button>
          </span>
        ))}
        <input
          className="gallery-clause__input"
          placeholder={placeholder}
          value={clauseInputs[inputKey] ?? ""}
          onChange={(e) => updateClauseInput(inputKey, e.target.value)}
          onKeyDown={(e) =>
            handleClauseInputKeyDown(
              e,
              galleryIndex,
              filterIndex,
              clauseIndex,
              clause.id,
              type,
            )
          }
          onPaste={(e) =>
            handleClauseInputPaste(
              e,
              galleryIndex,
              filterIndex,
              clauseIndex,
              clause.id,
              type,
            )
          }
        />
      </div>
    </div>
  );
};

export default GalleryFiltersTable;
