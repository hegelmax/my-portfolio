import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useGalleries } from "../../context/GalleriesContext";
import { buildFilterRoute } from "../../utils/galleryFilters";

import "./Sidebar.scss";

export default function Sidebar() {
  const [open, setOpen] = useState<string | null>(null);
  const location = useLocation();
  const { galleries } = useGalleries();

  const toggle = (name: string) => {
    setOpen((prev) => (prev === name ? null : name));
  };

  return (
    <header id="sidebar">
      <div className="sidebar-inner">
        <NavLink className="logo smooth-leave" to="/">
          <img src="/img/np.png" alt="NP" />
        </NavLink>

        <nav>
          <ul>
            <li>
              <NavLink to="/" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>
                Home
              </NavLink>
            </li>
            <li>
              <NavLink to="/about" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>
                About
              </NavLink>
            </li>
            <li>
              <NavLink to="/projects" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>
                Projects
              </NavLink>
            </li>

            {galleries
              .filter((gallery) => gallery.filters.some((filter) => filter.showInMenu))
              .map((gallery) => {
                const menuFilters = gallery.filters.filter((filter) => filter.showInMenu);
                if (menuFilters.length === 0) return null;
                const pathname = `/${gallery.routePath}`;
                const isActive = location.pathname.startsWith(pathname);
                const isOpen = open === gallery.id || isActive;
                return (
                  <li key={gallery.id} className="dropdown">
                    <span
                      className={isActive ? "current" : ""}
                      onClick={() => toggle(gallery.id)}
                    >
                      {gallery.menuLabel || gallery.title}
                    </span>
                    <ul style={{ display: isOpen ? "block" : "none" }}>
                      {menuFilters.map((filter) => {
                        const route = buildFilterRoute(gallery, filter);
                        return (
                          <li key={filter.id}>
                            <NavLink
                              to={route}
                              className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}
                            >
                              {filter.label}
                            </NavLink>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}

            <li>
              <NavLink to="/blog" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>
                Blog
              </NavLink>
            </li>
            <li>
              <NavLink to="/contact" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>
                Contact
              </NavLink>
            </li>
            <li>
              <a className="smooth-leave" target="_blank" href="https://cv.hgl.mx/nadia_hegel">
                CV
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
