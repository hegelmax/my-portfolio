import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { GalleryItem } from "./GalleryConfig";

interface GalleryLightboxProps {
  items: GalleryItem[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
}

const GalleryLightbox: React.FC<GalleryLightboxProps> = ({
  items,
  index,
  onClose,
  onPrev,
  onNext,
}) => {
  const currentItem = items[index];
  const touchStartXRef = useRef<number | null>(null);
  const wheelLastTimeRef = useRef<number>(0);

  if (!currentItem) return null;
  const focusX = currentItem.focusX ?? 50;
  const focusY = currentItem.focusY ?? 50;
  const fit = currentItem.fit === "contain" ? "contain" : "cover";
  const rotation =
    typeof currentItem.rotation === "number" ? ((currentItem.rotation % 360) + 360) % 360 : 0;

  // Block body scroll while lightbox is open
  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  // ESC and arrow keys
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose, onPrev, onNext]);

  // Swipe on mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const startX = touchStartXRef.current;
    if (startX == null) return;

    const endX = e.changedTouches[0].clientX;
    const deltaX = endX - startX;
    const threshold = 40;

    if (Math.abs(deltaX) > threshold) {
      if (deltaX < 0) {
        onNext();
      } else {
        onPrev();
      }
    }
    touchStartXRef.current = null;
  };

  // Scroll wheel navigation
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const now = Date.now();
    const THROTTLE = 250;

    if (now - wheelLastTimeRef.current < THROTTLE) {
      return;
    }
    wheelLastTimeRef.current = now;

    const delta =
      Math.abs(e.deltaY) > Math.abs(e.deltaX) ? e.deltaY : e.deltaX;

    if (delta > 0) {
      onNext();
    } else if (delta < 0) {
      onPrev();
    }
  };

  return createPortal(
    <div
      className="np-portfolio__lightbox"
      onClick={onClose}
      onWheel={handleWheel}
    >
      {/* Close */}
      <button
        type="button"
        className="np-portfolio__lightbox-close"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      >
        ×
      </button>

      {/* Prev */}
      <button
        type="button"
        className="np-portfolio__lightbox-nav np-portfolio__lightbox-nav--prev"
        onClick={(e) => {
          e.stopPropagation();
          onPrev();
        }}
      >
        ‹
      </button>

      {/* Next */}
      <button
        type="button"
        className="np-portfolio__lightbox-nav np-portfolio__lightbox-nav--next"
        onClick={(e) => {
          e.stopPropagation();
          onNext();
        }}
      >
        ›
      </button>

      {/* Inner */}
      <div
        className="np-portfolio__lightbox-inner"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src={currentItem.image}
          alt={currentItem.title}
          className="np-portfolio__lightbox-img"
          style={{
            objectFit: fit,
            objectPosition: `${focusX}% ${focusY}%`,
            transform: rotation ? `rotate(${rotation}deg)` : undefined,
          }}
        />
        <div className="np-portfolio__lightbox-caption">
          <h3>{currentItem.title}</h3>
          <p>
            {currentItem.category} ·{" "}
            {currentItem.tags.map((t) => `#${t}`).join("  ")}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default GalleryLightbox;
