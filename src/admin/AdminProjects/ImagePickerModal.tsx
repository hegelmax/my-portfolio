import React, { useEffect, useState } from "react";

type ImageInfo = {
  file: string; // "editorial/project1/img01.jpg"
  url: string;  // "/img/editorial/project1/img01.jpg"
  name: string;
};

type ImagePickerModalProps = {
  onClose: () => void;
  onApply: (images: ImageInfo[]) => void;
  initialSelected?: string[]; // list of already selected image URLs
};

type FolderNode = {
  name: string;
  relative: string;
  path: string;
  imageCount: number | null;
  children: FolderNode[];
};

export const ImagePickerModal: React.FC<ImagePickerModalProps> = ({
  onClose,
  onApply,
  initialSelected = [],
}) => {
  const [foldersTree, setFoldersTree] = useState<FolderNode | null>(null);
  const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
  const [images, setImages] = useState<ImageInfo[]>([]);
  const [selectedImages, setSelectedImages] = useState<Set<string>>(
    () => new Set(initialSelected)
  );
  const [loadingTree, setLoadingTree] = useState(false);
  const [loadingImages, setLoadingImages] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const loadTree = async () => {
      try {
        setLoadingTree(true);
        const resp = await fetch("/api/admin/images/tree", {
          credentials: "include",
        });
        const data = await resp.json();
        if (cancelled) return;
        if (!data.success) {
          throw new Error(data.error || "Failed to load folders tree");
        }
        setFoldersTree(data.root as FolderNode);
        setError(null);
      } catch (e: any) {
        if (cancelled) return;
        setError(e?.message || "Failed to load folders tree");
      } finally {
        setLoadingTree(false);
      }
    };
    loadTree();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggleFolder = (path: string) => {
    setSelectedFolders((prev) =>
      prev.includes(path)
        ? prev.filter((p) => p !== path)
        : [...prev, path]
    );
  };

  const handleLoadImages = async () => {
    if (selectedFolders.length === 0) return;
    try {
      setLoadingImages(true);
      const resp = await fetch("/api/admin/images/list", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ folders: selectedFolders }),
      });
      const data = await resp.json();
      if (!data.success) {
        throw new Error(data.errors?.join(", ") || "Failed to load images");
      }
      setImages(data.items as ImageInfo[]);
      setError(null);
    } catch (e: any) {
      setError(e?.message || "Failed to load images");
    } finally {
      setLoadingImages(false);
    }
  };

  const toggleImage = (url: string) => {
    setSelectedImages((prev) => {
      const next = new Set(prev);
      if (next.has(url)) {
        next.delete(url);
      } else {
        next.add(url);
      }
      return next;
    });
  };

  const handleApply = () => {
    const final = images.filter((img) => selectedImages.has(img.url));
    onApply(final);
  };

  const renderTree = (node: FolderNode | null) => {
    if (!node) return null;

    const renderNode = (n: FolderNode) => {
      const hasChildren = n.children && n.children.length > 0;
      const checked = selectedFolders.includes(n.path);

      return (
        <li key={n.path} className="img-tree__node">
          <label>
            <input
              type="checkbox"
              checked={checked}
              onChange={() => toggleFolder(n.path)}
            />
            <span className="img-tree__label">
              {n.name}
              {typeof n.imageCount === "number" && (
                <span className="img-tree__badge">
                  {n.imageCount}
                </span>
              )}
            </span>
          </label>
          {hasChildren && (
            <ul className="img-tree__children">
              {n.children.map((child) => renderNode(child))}
            </ul>
          )}
        </li>
      );
    };

    return (
      <ul className="img-tree">
        {node.children.map((child) => renderNode(child))}
      </ul>
    );
  };

  return (
    <div className="projects-modal-backdrop" onClick={onClose}>
      <div
        className="projects-modal img-picker-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="projects-modal__title">Select images</h2>

        {error && (
          <div className="projects-page__error">{error}</div>
        )}

        <div className="img-picker-layout">
          <div className="img-picker-layout__col">
            <div className="img-picker-section-title">Folders</div>
            {loadingTree && (
              <div className="projects-page__loading">
                Loading folders…
              </div>
            )}
            {!loadingTree && renderTree(foldersTree)}
            <button
              type="button"
              className="btn-secondary img-picker-load-btn"
              onClick={handleLoadImages}
              disabled={selectedFolders.length === 0 || loadingImages}
            >
              {loadingImages ? "Loading images…" : "Load images"}
            </button>
          </div>

          <div className="img-picker-layout__col">
            <div className="img-picker-section-title">
              Images ({images.length})
            </div>
            {loadingImages && (
              <div className="projects-page__loading">
                Loading images…
              </div>
            )}
            {!loadingImages && images.length === 0 && (
              <div className="projects-images-empty">
                No images loaded yet.
              </div>
            )}
            {!loadingImages && images.length > 0 && (
              <div className="img-picker-grid">
                {images.map((img) => {
                  const isSelected = selectedImages.has(img.url);
                  return (
                    <button
                      key={img.url}
                      type="button"
                      className={
                        "img-picker-grid__item" +
                        (isSelected ? " img-picker-grid__item--selected" : "")
                      }
                      onClick={() => toggleImage(img.url)}
                    >
                      <img
                        src={img.url}
                        alt={img.name}
                        className="img-picker-grid__thumb"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="projects-modal__footer">
          <button
            type="button"
            className="btn-ghost"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleApply}
            disabled={selectedImages.size === 0}
          >
            Attach selected
          </button>
        </div>
      </div>
    </div>
  );
};
