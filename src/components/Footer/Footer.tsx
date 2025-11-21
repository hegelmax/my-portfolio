import React from "react";
import { Link } from "react-router-dom";

import './Footer.scss'

const Footer: React.FC = () => {
  return (
    <footer className="footer">
      <div className="footer__inner">

        {/* ЛОГОКартинка вместо монограммы */}
        <div className="footer__logo">
          <img
            src="/img/np.png"
            width="50"
            height="50"
            alt="NP"
            className="footer__logo-img"
          />
        </div>

        {/* Соцсети */}
        <div className="footer__social">
          <a href="https://www.instagram.com/nadiapaley/" target="_blank" rel="noopener noreferrer">
            <i className="footer__icon ri-instagram-line"></i>
          </a>
          <a href="https://www.linkedin.com/in/nadiapaley/" target="_blank" rel="noopener noreferrer">
            <i className="footer__icon ri-linkedin-line"></i>
          </a>
          <Link to="/contact">
            <i className="footer__icon ri-mail-line"></i>
          </Link>
        </div>

        {/* Копирайт */}
        <div className="footer__copy">
          <p>© {new Date().getFullYear()} Nadia Paley</p>
          <p>
            Developed by{" "}
              <a href="https://http.consulting" target="_blank" rel="noopener noreferrer">
                http.consulting
              </a>
          </p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
