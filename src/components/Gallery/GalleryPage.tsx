import React, { useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GallerySection from "./Gallery";
import { useGalleries } from "../../context/GalleriesContext";
import { useMediaLibrary } from "../../hooks/useMediaLibrary";
import { buildFilterRoute, buildGalleryItems } from "../../utils/galleryFilters";

type GalleryPageProps = {
  galleryId: string;
};

const GalleryPage: React.FC<GalleryPageProps> = ({ galleryId }) => {
  const { galleries, loading: galleriesLoading } = useGalleries();
  const { items: mediaItems, loading: mediaLoading } = useMediaLibrary();
  const params = useParams();
  const navigate = useNavigate();

  const gallery = galleries.find((g) => g.id === galleryId);

  useEffect(() => {
    if (!galleriesLoading && !gallery) {
      navigate("/", { replace: true });
    }
  }, [gallery, galleriesLoading, navigate]);

  const initialFilterId = (() => {
    if (!gallery) return "All";
    const fallback = gallery.defaultFilterId || gallery.filters[0]?.id || "All";
    const requested = params.filterId ?? fallback;
    const exists = gallery.filters.some((f) => f.id === requested);
    return exists ? requested : fallback;
  })();

  useEffect(() => {
    if (!gallery) return;
    const requested = params.filterId;
    if (!requested) return;
    const exists = gallery.filters.some((f) => f.id === requested);
    if (!exists && gallery.filters[0]) {
      navigate(buildFilterRoute(gallery, gallery.filters[0]), {
        replace: true,
      });
    }
  }, [gallery, navigate, params.filterId]);

  if (!gallery) {
    if (galleriesLoading) {
      return <div className="gallery-loading">Loading gallery...</div>;
    }
    return <div className="gallery-loading">Gallery not found</div>;
  }

  const sectionConfig = useMemo(() => {
    const filters = gallery.filters.map((filter) => ({
      label: filter.label,
      value: filter.id,
      route: buildFilterRoute(gallery, filter),
    }));
    return {
      title: gallery.title,
      subtitle: gallery.subtitle ?? "",
      filters,
      dataUrl: "",
    };
  }, [gallery]);

  const galleryItems = useMemo(() => {
    if (mediaLoading) return [];
    return buildGalleryItems(gallery, mediaItems);
  }, [gallery, mediaItems, mediaLoading]);

  if (mediaLoading) {
    return <div className="gallery-loading">Loading media...</div>;
  }

  return (
    <GallerySection
      key={gallery.id}
      initialFilter={initialFilterId}
      config={sectionConfig}
      items={galleryItems}
    />
  );
};

export default GalleryPage;
