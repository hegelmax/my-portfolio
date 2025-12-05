import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useGalleries } from "../../context/GalleriesContext";
import { buildFilterRoute } from "../../utils/galleryFilters";
import { usePdfWorksMeta } from "../../hooks/usePdfWorksMeta";

import "./MobileHeader.scss";

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const { galleries } = useGalleries();
  const { hasWorks, loading } = usePdfWorksMeta();
  const showPdfWorks = !loading && hasWorks;

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  const handleNavigate = () => setOpen(false);

  return (
    <header id="mobile-header">
      <div className="mobile-header-inner">
        <Link className="logo" to="/">
          <img src="/img/np.png" width="50" alt="NP" />
        </Link>

        <button
          className={`burger ${open ? "is-open" : ""}`}
          id="mobile-burger"
          aria-label="Toggle navigation"
          onClick={() => setOpen((v) => !v)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <nav className={`mobile-nav ${open ? "is-open" : ""}`} id="mobile-nav">
        <ul>
          <li>
            <Link to="/" onClick={handleNavigate}>Home</Link>
          </li>
          <li>
            <Link to="/about" onClick={handleNavigate}>About</Link>
          </li>
          <li>
            <Link to="/projects" onClick={handleNavigate}>Projects</Link>
          </li>
          {showPdfWorks && (
            <li>
              <Link to="/works/pdf" onClick={handleNavigate}>PDF works</Link>
            </li>
          )}

          {galleries
            .filter((gallery) => gallery.filters.some((filter) => filter.showInMenu))
            .map((gallery) => {
              const menuFilters = gallery.filters.filter((filter) => filter.showInMenu);
              if (menuFilters.length === 0) return null;
              return (
                <li key={gallery.id} className="dropdown">
                  <span>{gallery.menuLabel || gallery.title}</span>
                  <ul>
                    {menuFilters.map((filter) => (
                      <li key={filter.id}>
                        <Link to={buildFilterRoute(gallery, filter)} onClick={handleNavigate}>
                          {filter.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </li>
              );
            })}

          <li>
            <Link to="/blog" onClick={handleNavigate}>Blog</Link>
          </li>
          <li>
            <Link to="/contact" onClick={handleNavigate}>Contact</Link>
          </li>
          <li>
            <a
              target="_blank"
              href="https://cv.paley.art"
              rel="noreferrer"
              aria-label="CV (opens in a new tab)"
            >
              CV <i className="nav-external-icon ri-external-link-line" aria-hidden="true" />
            </a>
          </li>
        </ul>
      </nav>
    </header>
  );
}
