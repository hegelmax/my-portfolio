export type GalleryFilterClauseMode = "ALL" | "ANY";

export interface GalleryFilterClause {
  id: string;
  mode: GalleryFilterClauseMode;
  tags: string[];
  excludeTags: string[];
}

export interface GalleryFilterConfig {
  id: string;
  label: string;
  showInMenu: boolean;
  clauses: GalleryFilterClause[];
}

export interface GalleryConfig {
  id: string;
  routePath: string;
  title: string;
  subtitle?: string;
  menuLabel: string;
  defaultFilterId: string;
  filters: GalleryFilterConfig[];
}

export interface GalleriesResponse {
  galleries: GalleryConfig[];
}

export interface MediaLibraryItem {
  id: number;
  path: string;
  filename: string;
  tags?: string[];
  width?: number;
  height?: number;
  alt?: string;
  credit?: string;
  format?: "1:1" | "1:2" | "2:1" | "2:2";
  focusX?: number;
  focusY?: number;
  fit?: "cover" | "contain";
  rotation?: number;
}
