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
}
