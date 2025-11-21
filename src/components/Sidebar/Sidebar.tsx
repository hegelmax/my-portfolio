import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";

import './Sidebar.scss';

export default function Sidebar() {
  const [open, setOpen] = useState<string | null>(null);
  const location = useLocation();
  const isPortfolioRoute = location.pathname.startsWith("/portfolio");

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
            {/* Home */}
            <li><NavLink to="/" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Home</NavLink></li>
            <li><NavLink to="/about" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>About</NavLink></li>
            <li><NavLink to="/projects" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Projects</NavLink></li>

            {/* Portfolio */}
            <li className="dropdown">
              <span className={isPortfolioRoute ? "current" : ""} onClick={() => toggle("portfolio")}>Portfolio</span>
              <ul style={{display: open === "portfolio" || isPortfolioRoute ? "block" : "none",}}>
                <li><NavLink to="/portfolio/premium" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Premium</NavLink></li>
                <li><NavLink to="/portfolio/rtw" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Ready-to-Wear</NavLink></li>
                <li><NavLink to="/portfolio/sketches" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Sketches</NavLink></li>
                <li><NavLink to="/portfolio/styling" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Styling</NavLink></li>
              </ul>
            </li>

            {/* Остальное можно оставить как есть */}
            <li className="dropdown">
              <span onClick={() => toggle("publications")}>Publications</span>
              <ul style={{display: open === "publications" ? "block" : "none"}}>
                <li><NavLink to="/publications/celebrities" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Celebrities</NavLink></li>
                <li><NavLink to="/publications/covers" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Covers</NavLink></li>
              </ul>
            </li>

            <li><NavLink to="/blog" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Blog</NavLink></li>
            <li><NavLink to="/contact" className={({ isActive }) => "smooth-leave" + (isActive ? " current" : "")}>Contact</NavLink></li>
            <li><a className="smooth-leave" target="_blank" href="https://cv.hgl.mx/nadia_hegel">CV</a></li>
          </ul>
        </nav>

        {/*<p className="copyright">
          © {new Date().getFullYear()} Nadia Paley
          <br />
          Crafted with care &amp; love.
        </p>*/}
      </div>
    </header>
  );
}

