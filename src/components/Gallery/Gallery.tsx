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

const GallerySection: React.FC<GallerySectionProps> = ({
  initialFilter,
  config
}) => {
  const navigate = useNavigate();

  const [items, setItems]                 = useState<GalleryItem[]>(DEFAULT_ITEMS);
  const [activeFilter, setActiveFilter]   = useState<FilterCategory>(initialFilter ?? "All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const gridRef = useRef<HTMLDivElement | null>(null);
  const isoRef = useRef<Isotope | null>(null);

  const filtersWrapRef                                = useRef<HTMLDivElement | null>(null);
  const [filtersStickyStyle, setFiltersStickyStyle]   = useState<React.CSSProperties>({});
  //const [filtersSpacerHeight, setFiltersSpacerHeight] = useState(0);

  const { title, subtitle, filters, dataUrl } = config;


  // элементы, доступные в текущем фильтре — для лайтбокса
  const visibleItems = useMemo(
    () =>
      activeFilter === "All"
        ? items
        : items.filter((item) => item.category === activeFilter),
    [activeFilter, items]           // ← ОБЯЗАТЕЛЬНО есть items
  );

  useEffect(() => {
    fetch(dataUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load portfolio JSON");
        return res.json();
      })
      .then((data: GalleryItem[]) => {
        const randomized = shuffleArray(data);
        setItems(randomized);
      })
      .catch((err) => {
        console.error("Portfolio JSON load error:", err);
        // в случае ошибки остаёмся на DEFAULT_ITEMS
      });
  }, [dataUrl]);


  // применяем initialFilter, если он меняется (например, переход по URL)
  useEffect(() => {
    if (!gridRef.current) return;

    const grid = gridRef.current;

    // ждём, пока под текущий набор visibleItems загрузятся картинки
    //const imgLoad =
    imagesLoaded(grid, () => {
      // если был старый инстанс — аккуратно убиваем
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
      // на всякий случай убираем инстанс, когда список видимых элементов меняется
      if (isoRef.current) {
        isoRef.current.destroy();
        isoRef.current = null;
      }
    };
  }, [visibleItems]);

  // Хук, который включает/выключает “фиксированность”
  useEffect(() => {
    const el = filtersWrapRef.current;
    if (!el) return;

    // исходная позиция блока фильтров относительно документа
    const initialTop = el.getBoundingClientRect().top + window.scrollY;

    const updateSticky = () => {
      if (!filtersWrapRef.current) return;

      const shouldStick = window.scrollY > initialTop;

      if (shouldStick) {
        const rect = filtersWrapRef.current.getBoundingClientRect();

        setFiltersStickyStyle({
          position: "fixed",
          top: 0, // если нужен отступ сверху (под header) — поменяй тут
          left: rect.left,
          width: rect.width,
          zIndex: 10,
          background: "#fff",
        });
        //setFiltersSpacerHeight(rect.height);
      } else {
        setFiltersStickyStyle({});
        //setFiltersSpacerHeight(0);
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

  // клик по табу
  const handleFilterClick = (filterValue: string) => {
    setActiveFilter(filterValue);

    // читаем конфиг
    const filter = filters.find(f => f.value === filterValue);

    if (filter?.route) {
      navigate(filter.route);
    }
  };


  // клик по плитке -> открыть лайтбокс (только на достаточной ширине)
  const openLightbox = (id: string) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const img = new Image();
    img.src = item.image;

    img.onload = () => {
      const shouldOpen = true;//window.innerWidth > 750; // твое текущее условие

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
      (lightboxIndex - 1 + visibleItems.length) % visibleItems.length
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
        {/* заголовок */}
        <header className="np-portfolio__header">
          <h2 className="np-portfolio__title">{title}</h2>
          {subtitle && (
            <p className="np-portfolio__subtitle">
              {subtitle}
            </p>
          )}
        </header>

        {/* фильтры */}
        <div
          className="np-portfolio__filters-wrap"
          ref={filtersWrapRef}
          style={filtersStickyStyle}
        >
          <div id="isotope-filters" className="np-portfolio__filters">
            {filters.map(f => (
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

        {/* grid для Isotope */}
        <div className="np-portfolio__grid" ref={gridRef}>
          <div className="grid-sizer" />

          {visibleItems.map((item) => (
            <article
              key={item.id}
              className={[
                "grid-item",
                "np-portfolio__item",
                categoryClass(item.category),
                widthClass(item.format),
                formatClass(item.format),
              ].join(" ")}
              onClick={() => openLightbox(item.id)}
            >
              <div className="np-portfolio__item-inner">
                <img
                  src={item.image}
                  alt={item.title}
                  className="np-portfolio__img"
                />
                <div className="np-portfolio__overlay">
                  <div className="np-portfolio__overlay-content">
                    <h3>{item.title}</h3>
                    <ul>
                      <li>{item.category}</li>
                      {item.tags.map((tag) => (
                        <li key={tag}>#{tag}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </article>
          ))}
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
