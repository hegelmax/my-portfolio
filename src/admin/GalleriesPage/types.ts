import type {
  GalleryConfig,
  GalleryFilterClause,
} from "../../types/galleries";

export type ClauseInputType = "tags" | "excludeTags";

export type DragFilterState = {
  galleryIndex: number;
  filterIndex: number;
} | null;

export type UpdateGalleryFn = (
  index: number,
  updater: (gallery: GalleryConfig) => GalleryConfig,
) => void;

export type UpdateClauseDataFn = (
  galleryIndex: number,
  filterIndex: number,
  clauseIndex: number,
  updater: (clause: GalleryFilterClause) => GalleryFilterClause,
) => void;
