import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import Isotope from "isotope-layout";
import imagesLoaded from "imagesloaded";

import "./Gallery.scss";

import {
  DEFAULT_ITEMS,
  categoryClass,
  formatClass,
  widthClass,
  type GalleryItem,
  type FilterCategory,
  type GallerySectionProps,
} from "./GalleryConfig";

import GalleryLightbox from "./GalleryLightbox";

function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

const getItemCategories = (item: GalleryItem): string[] => {
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    return item.categories;
  }
  if (item.category) return [item.category];
  return [];
};

const GallerySection: React.FC<GallerySectionProps> = ({
  initialFilter,
  config,
  items: itemsProp,
}) => {
  const navigate = useNavigate();

  const defaultFilter = initialFilter ?? config.filters[0]?.value ?? "All";
  const [items, setItems] = useState<GalleryItem[]>(itemsProp ?? DEFAULT_ITEMS);
  const [activeFilter, setActiveFilter] = useState<FilterCategory>(defaultFilter);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const isoRef = useRef<Isotope | null>(null);

  const filtersWrapRef = useRef<HTMLDivElement | null>(null);
  const [filtersStickyStyle, setFiltersStickyStyle] = useState<React.CSSProperties>({});

  const { title, subtitle, filters, dataUrl } = config;

  const visibleItems = useMemo(
    () =>
      activeFilter === "All"
        ? items
        : items.filter((item) => {
            const categories = getItemCategories(item);
            if (categories.length === 0) return false;
            return categories.includes(activeFilter);
          }),
    [activeFilter, items],
  );

  useEffect(() => {
    if (itemsProp) {
      const randomized = shuffleArray(itemsProp);
      setItems(randomized);
      return;
    }

    if (!dataUrl) {
      setItems(DEFAULT_ITEMS);
      return;
    }

    fetch(dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load gallery JSON");
        return res.json();
      })
      .then((data: GalleryItem[]) => {
        const randomized = shuffleArray(data);
        setItems(randomized);
      })
      .catch((err) => {
        console.error("Gallery JSON load error:", err);
        setItems(DEFAULT_ITEMS);
      });
  }, [dataUrl, itemsProp]);

  useEffect(() => {
    if (initialFilter) {
      setActiveFilter(initialFilter);
    }
  }, [initialFilter]);

  useEffect(() => {
    if (!gridRef.current) return;

    const grid = gridRef.current;

    imagesLoaded(grid, () => {
      if (isoRef.current) {
        isoRef.current.destroy();
        isoRef.current = null;
      }

      isoRef.current = new Isotope(grid, {
        itemSelector: ".grid-item",
        percentPosition: true,
        transitionDuration: "0.4s",
        hiddenStyle: { opacity: 0 },
        visibleStyle: { opacity: 1 },
        masonry: {
          columnWidth: ".grid-sizer",
        },
      });
    });

    return () => {
      if (isoRef.current) {
        isoRef.current.destroy();
        isoRef.current = null;
      }
    };
  }, [visibleItems]);

  useEffect(() => {
    const el = filtersWrapRef.current;
    if (!el) return;

    const initialTop = el.getBoundingClientRect().top + window.scrollY;

    const updateSticky = () => {
      if (!filtersWrapRef.current) return;

      const shouldStick = window.scrollY > initialTop;

      if (shouldStick) {
        setFiltersStickyStyle({
          position: "sticky",
          top: 0,
          zIndex: 5,
        });
      } else {
        setFiltersStickyStyle({});
      }
    };

    window.addEventListener("scroll", updateSticky);
    window.addEventListener("resize", updateSticky);
    updateSticky();

    return () => {
      window.removeEventListener("scroll", updateSticky);
      window.removeEventListener("resize", updateSticky);
    };
  }, []);

  const handleFilterClick = (filterValue: string) => {
    setActiveFilter(filterValue);

    const filter = filters.find((f) => f.value === filterValue);
    if (filter?.route) {
      navigate(filter.route);
    }
  };

  const openLightbox = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const img = new Image();
    img.src = item.image;

    img.onload = () => {
      const shouldOpen = true;

      if (shouldOpen) {
        const index = visibleItems.findIndex((i) => i.id === id);
        if (index !== -1) {
          setLightboxIndex(index);
        }
      }
    };
  };

  const closeLightbox = () => setLightboxIndex(null);

  const showPrev = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex(
      (lightboxIndex - 1 + visibleItems.length) % visibleItems.length,
    );
  };

  const showNext = () => {
    if (lightboxIndex === null) return;
    setLightboxIndex((lightboxIndex + 1) % visibleItems.length);
  };

  return (
    <>
      <section
        className="np-portfolio"
        id="portfolio"
        data-section="portfolio"
      >
        <header className="np-portfolio__header">
          <h2 className="np-portfolio__title">{title}</h2>
          {subtitle && (
            <p className="np-portfolio__subtitle">
              {subtitle}
            </p>
          )}
        </header>

        <div
          className="np-portfolio__filters-wrap"
          ref={filtersWrapRef}
          style={filtersStickyStyle}
        >
          <div id="isotope-filters" className="np-portfolio__filters">
            {filters.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => handleFilterClick(f.value)}
                className={
                  "np-portfolio__filter" +
                  (f.value === activeFilter ? " np-portfolio__filter--active" : "")
                }
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="np-portfolio__grid" ref={gridRef}>
          <div className="grid-sizer" />

          {visibleItems.map((item) => {
            const categories = getItemCategories(item);
            const categoryClasses = categories
              .map((category) => categoryClass(category))
              .join(" ");
            const focusX = item.focusX ?? 50;
            const focusY = item.focusY ?? 50;
            const imgStyle: React.CSSProperties = {
              objectFit: item.fit === "contain" ? "contain" : "cover",
              objectPosition: `${focusX}% ${focusY}%`,
              transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
              ["--np-img-transform" as string]: item.rotation
                ? `rotate(${item.rotation}deg)`
                : "none",
            };

            const innerClassName =
              "np-portfolio__item-inner" +
              (item.fit === "contain" ? " np-portfolio__item-inner--contain" : "");

            return (
              <article
                key={item.id}
                className={[
                  "grid-item",
                  "np-portfolio__item",
                  categoryClasses,
                  widthClass(item.format),
                  formatClass(item.format),
                ].join(" ")}
                onClick={() => openLightbox(item.id)}
              >
                <div className={innerClassName}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="np-portfolio__img"
                    style={imgStyle}
                  />
                  <div className="np-portfolio__overlay">
                    <div className="np-portfolio__overlay-content">
                      <h3>{item.title}</h3>
                      <ul>
                        {categories.map((category) => (
                          <li key={category}>{category}</li>
                        ))}
                        {item.tags.map((tag) => (
                          <li key={tag}>#{tag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {lightboxIndex !== null && (
        <GalleryLightbox
          items={visibleItems}
          index={lightboxIndex}
          onClose={closeLightbox}
          onPrev={showPrev}
          onNext={showNext}
        />
      )}
    </>
  );
};

export default GallerySection;
