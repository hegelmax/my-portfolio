import type { GalleryConfig, GalleryFilterConfig, MediaLibraryItem } from "../types/galleries";
import type { GalleryItem } from "../components/Gallery/GalleryConfig";

const normalize = (value: string) => value.toLowerCase().trim();

const clauseMatches = (clause: GalleryFilterConfig["clauses"][number], tagsSet: Set<string>) => {
  const includeTags = clause.tags?.map(normalize) ?? [];
  const excludeTags = clause.excludeTags?.map(normalize) ?? [];

  const positive =
    includeTags.length === 0
      ? true
      : clause.mode === "ALL"
      ? includeTags.every((tag) => tagsSet.has(tag))
      : includeTags.some((tag) => tagsSet.has(tag));

  if (!positive) return false;

  if (excludeTags.length === 0) return true;
  return excludeTags.every((tag) => !tagsSet.has(tag));
};

export const filterMatchesMedia = (
  filter: GalleryFilterConfig,
  media: MediaLibraryItem,
) => {
  const tags = Array.isArray(media.tags) ? media.tags : [];
  const tagsSet = new Set(tags.map(normalize));
  const clauses = filter.clauses ?? [];
  if (clauses.length === 0) return false;
  return clauses.some((clause) => clauseMatches(clause, tagsSet));
};

const formatFromDimensions = (width?: number, height?: number): GalleryItem["format"] => {
  if (!width || !height) return "1:1";
  const ratio = width / height;
  if (ratio >= 1.6) return "2:1";
  if (ratio <= 0.625) return "1:2";
  if (ratio >= 1.2 && ratio <= 1.4) return "2:2";
  return "1:1";
};

export const buildGalleryItems = (
  gallery: GalleryConfig,
  mediaItems: MediaLibraryItem[],
) => {
  const defaultFilterId =
    gallery.defaultFilterId || gallery.filters[0]?.id || "all";
  const filtersWithRules = gallery.filters.filter(
    (filter) => (filter.clauses?.length ?? 0) > 0,
  );

  return mediaItems
    .map<GalleryItem | null>((media) => {
      const matchedFilters = filtersWithRules
        .filter((filter) => filterMatchesMedia(filter, media))
        .map((filter) => filter.id);

      if (matchedFilters.length === 0) {
        return null;
      }

      const categories = [defaultFilterId, ...matchedFilters];

      return {
        id: `media-${media.id ?? media.path}`,
        title: media.filename || media.path.split("/").pop() || "Image",
        image: media.path,
        categories,
        tags: media.tags ?? [],
        format: formatFromDimensions(media.width, media.height),
      };
    })
    .filter(Boolean) as GalleryItem[];
};

export const buildFilterRoute = (
  gallery: GalleryConfig,
  filter: GalleryFilterConfig,
) => {
  const base = `/${gallery.routePath}`;
  if (filter.id === gallery.defaultFilterId) {
    return base;
  }
  return `${base}/${filter.id}`;
};
