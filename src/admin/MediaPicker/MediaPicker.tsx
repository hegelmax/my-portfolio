import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useRef,
} from "react";
import type { KeyboardEvent } from "react";
import "./MediaPicker.scss";

type MediaItem = {
  id: number;
  path: string;
  filename: string;
  tags?: string[];
};

type MediaPickerVariant = "modal" | "embedded";
type BulkAction = "add" | "replace" | "remove";

type MediaPickerProps = {
  isOpen: boolean;
  onClose?: () => void;
  onSelect?: (paths: string[]) => void;
  variant?: MediaPickerVariant;
  title?: string;
  subtitle?: string;
  showSearch?: boolean;
  enableBulkEditing?: boolean;
};

const MIN_CARD_WIDTH = 150;
const MIN_CARD_HEIGHT = 180;

const normalizeTags = (value: string) =>
  value
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

const collectAllTags = (list: MediaItem[]) => {
  const tagsSet = new Set<string>();
  list.forEach((item) => {
    if (Array.isArray(item.tags)) {
      item.tags.forEach((t) => tagsSet.add(t));
    }
  });
  return Array.from(tagsSet).sort((a, b) => a.localeCompare(b));
};

const MediaPicker: React.FC<MediaPickerProps> = ({
  isOpen,
  onClose = () => {},
  onSelect,
  variant = "modal",
  title = "Media library",
  subtitle = "Browse, upload and filter images.",
  showSearch = true,
  enableBulkEditing,
}) => {
  const isEmbedded = variant === "embedded";
  const canUseSelection = typeof onSelect === "function";
  const bulkEditingEnabled = enableBulkEditing ?? isEmbedded;

  const [items, setItems] = useState<MediaItem[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [selectedPaths, setSelectedPaths] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(60);
  const gridRef = useRef<HTMLDivElement | null>(null);

  const [bulkTagInput, setBulkTagInput] = useState("");
  const [bulkStatus, setBulkStatus] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [renameMode, setRenameMode] = useState(false);
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameStatus, setRenameStatus] = useState<string | null>(null);
  const [renaming, setRenaming] = useState(false);
  const [individualTagDeleteMode, setIndividualTagDeleteMode] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const resp = await fetch("/api/admin/media/list", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          tags: selectedTags,
          search,
          page: 1,
          pageSize: 60,
        }),
      });

      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to load media");
      }

      const list: MediaItem[] = Array.isArray(data.items) ? data.items : [];
      setItems(list);
      setAllTags(collectAllTags(list));
      setCurrentPage(1);
    } catch (e: any) {
      setError(e?.message || "Failed to load media");
    } finally {
      setLoading(false);
    }
  }, [selectedTags, search]);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPaths([]);
    setBulkTagInput("");
    setBulkStatus(null);
    setRenameStatus(null);
    setRenamingTag(null);
    setRenameValue("");
    setRenameMode(false);
    setIndividualTagDeleteMode(false);
    load();
  }, [isOpen, load]);

  const handleToggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const isTagActive = useCallback(
    (tag: string) => selectedTags.includes(tag),
    [selectedTags],
  );

  const hasFilters = useMemo(
    () => selectedTags.length > 0 || (showSearch && search.trim() !== ""),
    [selectedTags, search, showSearch],
  );

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (
    e,
  ) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    const files = Array.from(fileList);

    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    const batchTag =
      "batch_" +
      now.getFullYear() +
      pad(now.getMonth() + 1) +
      pad(now.getDate()) +
      pad(now.getHours()) +
      pad(now.getMinutes()) +
      pad(now.getSeconds());

    try {
      setUploading(true);
      setError(null);

      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("tags", batchTag);

        const resp = await fetch("/api/admin/media/upload", {
          method: "POST",
          credentials: "include",
          body: formData,
        });

        const data = await resp.json();
        if (!data.success) {
          throw new Error(data.error || "Upload failed");
        }

        const newItem: MediaItem = data.item;
        setItems((prev) => {
          const next = [newItem, ...prev];
          setAllTags(collectAllTags(next));
          return next;
        });
      }

      setSelectedTags((prev) =>
        prev.includes(batchTag) ? prev : [...prev, batchTag],
      );
    } catch (e: any) {
      setError(e?.message || "Upload error");
    } finally {
      setUploading(false);
    }
  };

  const toggleSelectPath = (path: string) => {
    setSelectedPaths((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const handleUseSelected = () => {
    if (!canUseSelection || selectedPaths.length === 0) return;
    onSelect?.(selectedPaths);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) return;

    const recalcPageSize = () => {
      if (!isOpen) return;

      const width =
        gridRef.current?.clientWidth && gridRef.current.clientWidth > 0
          ? gridRef.current.clientWidth
          : window.innerWidth - (isEmbedded ? 120 : 160);
      const availableHeight =
        window.innerHeight - (isEmbedded ? 280 : 360);

      const columns = Math.max(1, Math.floor(width / MIN_CARD_WIDTH));
      const rows = Math.max(
        1,
        Math.floor(Math.max(availableHeight, 240) / MIN_CARD_HEIGHT),
      );
      const nextSize = Math.max(columns * rows, columns * 2);
      setPageSize(nextSize);
    };

    recalcPageSize();
    window.addEventListener("resize", recalcPageSize);

    return () => {
      window.removeEventListener("resize", recalcPageSize);
    };
  }, [isEmbedded, isOpen]);

  useEffect(() => {
    const total = Math.max(1, Math.ceil(items.length / pageSize));
    if (currentPage > total) {
      setCurrentPage(total);
    }
  }, [currentPage, items.length, pageSize]);

  const pageStart = (currentPage - 1) * pageSize;
  const pageItems = items.slice(pageStart, pageStart + pageSize);
  const totalPages = Math.max(1, Math.ceil(items.length / pageSize));

  const selectedItems = useMemo(() => {
    if (selectedPaths.length === 0) return [];
    const map = new Set(selectedPaths);
    return items.filter((item) => map.has(item.path));
  }, [items, selectedPaths]);

  const selectionTagEntries = useMemo(() => {
    const total = selectedItems.length;
    if (total === 0) return [] as { tag: string; count: number; full: boolean }[];
    const counts = new Map<string, number>();
    selectedItems.forEach((item) => {
      (item.tags || []).forEach((tag) => {
        counts.set(tag, (counts.get(tag) || 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([tag, count]) => ({ tag, count, full: count === total }));
  }, [selectedItems]);

  const toggleRenameMode = () => {
    setRenameMode((prev) => !prev);
    setRenamingTag(null);
    setRenameValue("");
    setRenameStatus(null);
  };

  const startTagRename = (tag: string) => {
    setRenamingTag(tag);
    setRenameValue(tag);
    setRenameStatus(null);
  };

  const cancelTagRename = () => {
    setRenamingTag(null);
    setRenameValue("");
  };

  const applyRename = async (from: string, to: string) => {
    const trimmed = to.trim();
    if (!trimmed || trimmed === from) {
      setRenameStatus("Введите новое имя тега");
      return;
    }
    setRenaming(true);
    setRenameStatus(null);
    try {
      const resp = await fetch("/api/admin/media/tags/rename", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: trimmed }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to rename tag");
      }

      setItems((prev) => {
        const next = prev.map((item) => {
          if (!Array.isArray(item.tags)) return item;
          if (!item.tags.includes(from)) return item;
          const updatedTags = Array.from(
            new Set(
              item.tags.map((tag) => (tag === from ? trimmed : tag)).filter((t) => t !== ""),
            ),
          );
          return { ...item, tags: updatedTags };
        });
        setAllTags(collectAllTags(next));
        return next;
      });
      setSelectedTags((prev) =>
        prev.map((tag) => (tag === from ? trimmed : tag)),
      );
      setRenameStatus(`Renamed #${from} -> #${trimmed}`);
      setRenamingTag(null);
      setRenameValue("");
    } catch (e: any) {
      setRenameStatus(e?.message || "Failed to rename tag");
    } finally {
      setRenaming(false);
    }
  };

  const handleRenameKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
    tag: string,
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      applyRename(tag, renameValue);
    }
    if (event.key === "Escape") {
      event.preventDefault();
      cancelTagRename();
    }
  };

  type MutationOptions = {
    showStatus?: boolean;
    clearInputOnSuccess?: boolean;
    skipLoadingState?: boolean;
  };

  const mutateTags = async (
    action: BulkAction,
    tagsList: string[],
    targetPaths: string[],
    options: MutationOptions = {},
  ) => {
    const shouldShowStatus = options.showStatus !== false;
    if (targetPaths.length === 0) {
      if (shouldShowStatus) setBulkStatus("Выберите изображения");
      return;
    }
    if (action !== "remove" && tagsList.length === 0) {
      if (shouldShowStatus) setBulkStatus("Укажите тег");
      return;
    }

    if (!options.skipLoadingState) {
      setBulkLoading(true);
    }
    if (shouldShowStatus) {
      setBulkStatus(null);
    }

    try {
      const resp = await fetch("/api/admin/media/tags/bulk", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, tags: tagsList, paths: targetPaths }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.error || "Failed to update tags");
      }

      const pathSet = new Set(targetPaths);
      setItems((prev) => {
        const next = prev.map((item) => {
          if (!pathSet.has(item.path)) return item;
          const prevTags = Array.isArray(item.tags) ? item.tags : [];
          let nextTags: string[] = [];
          if (action === "add") {
            nextTags = Array.from(new Set([...prevTags, ...tagsList]));
          } else if (action === "replace") {
            nextTags = [...tagsList];
          } else {
            if (tagsList.length === 0) {
              nextTags = [];
            } else {
              const removeSet = new Set(tagsList);
              nextTags = prevTags.filter((tag) => !removeSet.has(tag));
            }
          }
          return { ...item, tags: nextTags };
        });
        setAllTags(collectAllTags(next));
        return next;
      });

      if (options.clearInputOnSuccess) {
        setBulkTagInput("");
      }
      if (shouldShowStatus) {
        setBulkStatus("Теги обновлены");
      }
    } catch (e: any) {
      if (shouldShowStatus) {
        setBulkStatus(e?.message || "Failed to update tags");
      }
    } finally {
      if (!options.skipLoadingState) {
        setBulkLoading(false);
      }
    }
  };

  const handleBulkAction = (
    action: BulkAction,
    tagsOverride?: string[],
    pathsOverride?: string[],
    options?: MutationOptions,
  ) => {
    const tagsList = tagsOverride ?? normalizeTags(bulkTagInput);
    const targetPaths = pathsOverride ?? selectedPaths;
    const mergedOptions: MutationOptions = {
      clearInputOnSuccess: !tagsOverride,
      ...options,
    };
    return mutateTags(action, tagsList, targetPaths, mergedOptions);
  };

  const handleSelectionInputKeyDown = (
    event: KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key === "Enter" && bulkTagInput.trim() !== "") {
      event.preventDefault();
      handleBulkAction("add", [bulkTagInput.trim()], undefined, {
        clearInputOnSuccess: true,
      });
    }
  };

  const handleSelectionTagRemove = (tag: string) => {
    handleBulkAction("remove", [tag]);
  };

  const handleSelectionTagFill = (tag: string) => {
    handleBulkAction("add", [tag]);
  };

  const handleIndividualTagRemove = (path: string, tag: string) => {
    mutateTags("remove", [tag], [path], {
      showStatus: false,
      skipLoadingState: true,
    });
  };

  const tagsDatalistId = useMemo(
    () =>
      isEmbedded ? "media-picker-tags-embedded" : "media-picker-tags-modal",
    [isEmbedded],
  );

  if (!isEmbedded && !isOpen) return null;

  const toolbar = (
    <div className="media-picker__toolbar">
      <div className="media-picker__toolbar-left">
        <input
          type="file"
          ref={fileInputRef}
          className="media-picker__file-input"
          accept="image/*"
          multiple
          onChange={handleFileChange}
          disabled={uploading}
        />
        <button
          type="button"
          className="media-picker__icon-btn"
          title="Добавить фото"
          onClick={handleUploadClick}
          disabled={uploading}
        >
          📤
        </button>
        <button
          type="button"
          className={
            "media-picker__icon-btn" + (renameMode ? " media-picker__icon-btn--active" : "")
          }
          title={renameMode ? "Выйти из режима переименования" : "Переименовать теги"}
          onClick={toggleRenameMode}
          disabled={renaming}
        >
          ✏️
        </button>
        <button
          type="button"
          className={
            "media-picker__icon-btn" +
            (individualTagDeleteMode ? " media-picker__icon-btn--active" : "")
          }
          title={
            individualTagDeleteMode
              ? "Выключить режим удаления тегов"
              : "Удалять теги у отдельных фото"
          }
          onClick={() => setIndividualTagDeleteMode((prev) => !prev)}
        >
          ❌
        </button>
      </div>
      <div className="media-picker__toolbar-right">
        {showSearch && (
          <input
            type="text"
            value={search}
            placeholder="Search by file name"
            onChange={(e) => setSearch(e.target.value)}
            className="media-picker__search-input"
          />
        )}
        {hasFilters && (
          <button
            type="button"
            className="media-picker__btn media-picker__btn--ghost"
            onClick={() => {
              setSearch("");
              setSelectedTags([]);
            }}
          >
            Clear filters
          </button>
        )}
        <button
          type="button"
          className="media-picker__btn media-picker__btn--ghost"
          onClick={load}
          disabled={loading}
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>
    </div>
  );

  const selectionPanel =
    bulkEditingEnabled && selectedPaths.length > 0 ? (
      <div className="media-picker__selection-panel">
        <div className="media-picker__selection-meta">
          <span>{selectedPaths.length} selected</span>
          {bulkStatus && (
            <span className="media-picker__selection-status">{bulkStatus}</span>
          )}
        </div>
        <div className="media-picker__selection-inputs">
          <input
            type="text"
            placeholder="Add tag and press Enter"
            value={bulkTagInput}
            onChange={(e) => setBulkTagInput(e.target.value)}
            onKeyDown={handleSelectionInputKeyDown}
            list={tagsDatalistId}
            disabled={bulkLoading}
          />
          <button
            type="button"
            className="media-picker__btn media-picker__btn--primary"
            disabled={bulkLoading || bulkTagInput.trim() === ""}
            onClick={() =>
              handleBulkAction("add", [bulkTagInput.trim()], undefined, {
                clearInputOnSuccess: true,
              })
            }
          >
            Добавить
          </button>
          <datalist id={tagsDatalistId}>
            {allTags.map((tag) => (
              <option key={tag} value={tag} />
            ))}
          </datalist>
        </div>
        <div className="media-picker__selection-tags">
          {selectionTagEntries.length === 0 && (
            <span className="media-picker__selection-placeholder">
              Нет тегов у выбранных фото
            </span>
          )}
          {selectionTagEntries.map(({ tag, full }) => (
            <span
              key={tag}
              className={
                "media-picker__selection-tag" +
                (full
                  ? " media-picker__selection-tag--full"
                  : " media-picker__selection-tag--partial")
              }
            >
              <span>#{tag}</span>
              {!full && (
                <button
                  type="button"
                  className="media-picker__selection-action"
                  title="Заполнить тег на всех фото"
                  onClick={() => handleSelectionTagFill(tag)}
                  disabled={bulkLoading}
                >
                  🪄
                </button>
              )}
              <button
                type="button"
                className="media-picker__selection-action"
                title="Удалить тег со всех выбранных"
                onClick={() => handleSelectionTagRemove(tag)}
                disabled={bulkLoading}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>
    ) : null;

  const tagsRow = (
    <div className="media-picker__tags-wrap">
      {renameStatus && renameMode && (
        <div className="media-picker__rename-status-text">{renameStatus}</div>
      )}
      {allTags.length > 0 ? (
        <div className="media-picker__tags-row">
          {allTags.map((tag) => {
            const active = isTagActive(tag);
            const editing = renameMode && renamingTag === tag;
            return (
              <div
                key={tag}
                className={
                  "media-picker__tag" +
                  (active ? " media-picker__tag--active" : "") +
                  (editing ? " media-picker__tag--editing" : "")
                }
              >
                {editing ? (
                  <input
                    className="media-picker__tag-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onKeyDown={(e) => handleRenameKeyDown(e, tag)}
                    autoFocus
                  />
                ) : (
                  <button type="button" onClick={() => handleToggleTag(tag)}>
                    #{tag}
                  </button>
                )}
                {renameMode && !editing && (
                  <button
                    type="button"
                    className="media-picker__tag-edit-btn"
                    onClick={() => startTagRename(tag)}
                    title="Переименовать тег"
                  >
                    ✏️
                  </button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="media-picker__status">Нет тегов</div>
      )}
    </div>
  );

  const pickerBody = (
    <div
      className={
        "media-picker" + (isEmbedded ? " media-picker--embedded" : "")
      }
      onClick={(e) => e.stopPropagation()}
    >
      <div className="media-picker__header">
        <div>
          <h2 className="media-picker__title">{title}</h2>
          <p className="media-picker__subtitle">{subtitle}</p>
        </div>
        {!isEmbedded && (
          <button
            type="button"
            className="media-picker__close-btn"
            onClick={onClose}
            aria-label="Close media picker"
          >
            ×
          </button>
        )}
      </div>

      {toolbar}
      {selectionPanel}
      {tagsRow}

      {error && <div className="media-picker__error">{error}</div>}

      <div className="media-picker__grid" ref={gridRef}>
        {loading && (
          <div className="media-picker__status">Loading media...</div>
        )}

        {!loading && !error && pageItems.length === 0 && (
          <div className="media-picker__status">
            Медиа не найдены. Попробуйте изменить фильтры.
          </div>
        )}

        {!loading &&
          !error &&
          pageItems.map((item) => {
            const isSelected = selectedPaths.includes(item.path);
            return (
              <button
                key={item.id}
                type="button"
                className={
                  "media-picker__item" +
                  (isSelected ? " media-picker__item--selected" : "")
                }
                onClick={() => toggleSelectPath(item.path)}
              >
                <div className="media-picker__thumb">
                  <img src={item.path} alt={item.filename} />
                  <div className="media-picker__thumb-tags">
                    {(item.tags && item.tags.length > 0 ? item.tags : ["No tags"]).map((tag, index) => (
                      <span
                        key={tag + index.toString()}
                        className={
                          "media-picker__item-tag" +
                          (tag === "No tags"
                            ? " media-picker__item-tag--empty"
                            : "")
                        }
                      >
                        {tag === "No tags" ? tag : `#${tag}`}
                        {tag !== "No tags" && individualTagDeleteMode && (
                          <button
                            type="button"
                            className="media-picker__item-tag-remove"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleIndividualTagRemove(item.path, tag);
                            }}
                          >
                            ×
                          </button>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
                {isSelected && (
                  <div className="media-picker__item-check">✓</div>
                )}
              </button>
            );
          })}
      </div>

      {totalPages > 1 && (
        <div className="media-picker__pagination">
          <button
            type="button"
            className="media-picker__btn media-picker__btn--ghost"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
          >
            Previous
          </button>
          <span>
            Page {currentPage} / {totalPages}
          </span>
          <button
            type="button"
            className="media-picker__btn media-picker__btn--ghost"
            disabled={currentPage === totalPages}
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
            }
          >
            Next
          </button>
        </div>
      )}

      <div className="media-picker__footer">
        <div className="media-picker__selected-info">
          {selectedPaths.length > 0 ? (
            <span>{selectedPaths.length} selected</span>
          ) : (
            <span>No images selected</span>
          )}
        </div>
        {canUseSelection && (
          <button
            type="button"
            className="media-picker__btn media-picker__btn--primary"
            disabled={selectedPaths.length === 0}
            onClick={handleUseSelected}
          >
            Use selected
          </button>
        )}
      </div>
    </div>
  );

  if (isEmbedded) {
    return isOpen ? pickerBody : null;
  }

  return (
    <div className="media-picker-modal" onClick={onClose}>
      {pickerBody}
    </div>
  );
};

export default MediaPicker;

