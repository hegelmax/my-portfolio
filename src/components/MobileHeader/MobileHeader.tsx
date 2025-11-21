import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";

import './MobileHeader.scss';

export default function MobileHeader() {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  
  // закрывать меню при любом переходе
  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

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
          <li><Link to="/" onClick={() => setOpen(false)}>Home</Link></li>
          <li><Link to="/about" onClick={() => setOpen(false)}>About</Link></li>
          <li><Link to="/projects" onClick={() => setOpen(false)}>Projects</Link></li>

          <li className="dropdown">
            <span>Portfolio</span>
            <ul>
              <li><Link to="/portfolio/premium" onClick={() => setOpen(false)}>Premium</Link></li>
              <li><Link to="/portfolio/rtw" onClick={() => setOpen(false)}>Ready-to-Wear</Link></li>
              <li><Link to="/portfolio/sketches" onClick={() => setOpen(false)}>Sketches</Link></li>
              <li><Link to="/portfolio/styling" onClick={() => setOpen(false)}>Styling</Link></li>
            </ul>
          </li>

          <li className="dropdown">
            <span>Publications</span>
            <ul>
              <li><Link to="/publications/celebrities" onClick={() => setOpen(false)}>Celebrities</Link></li>
              <li><Link to="/publications/covers" onClick={() => setOpen(false)}>Covers</Link></li>
            </ul>
          </li>

          <li><Link to="/blog" onClick={() => setOpen(false)}>Blog</Link></li>
          <li><Link to="/contact" onClick={() => setOpen(false)}>Contact</Link></li>
          <li><a target="_blank" href="https://cv.hgl.mx/nadia_hegel">CV</a></li>
        </ul>
      </nav>
    </header>
  );
}

