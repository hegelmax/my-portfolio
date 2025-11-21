import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

import './HeroSection.scss';

export default function HeroSection() {
  const sceneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    // только на десктопе, чтобы не дёргать мобилу
    if (window.innerWidth < 1024) return;

    const layers = Array.from(
      scene.querySelectorAll<HTMLElement>(".layer")
    );

    const handleMouseMove = (e: MouseEvent) => {
      const rect = scene.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      // нормализованные координаты от -1 до 1
      const relX = (e.clientX - centerX) / rect.width;
      const relY = (e.clientY - centerY) / rect.height;

      layers.forEach((layer) => {
        const depthAttr = layer.getAttribute("data-depth") || "0";
        const depth = parseFloat(depthAttr);

        // коэффициент можно подправить (20–40)
        const moveX = -relX * depth * 40;
        const moveY = -relY * depth * 40;

        layer.style.transform = `translate3d(${moveX}px, ${moveY}px, 0)`;
      });
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      // на unmount вернём слои в ноль
      layers.forEach((layer) => {
        layer.style.transform = "translate3d(0, 0, 0)";
      });
    };
  }, []);

  return (
    <section className="hero" id="hero">
      <div className="left_part">
        <div className="left_in" id="scene" ref={sceneRef}>
          <div className="dots layer" data-switch="disable" data-depth="0.4"></div>

          <div className="layer border" data-depth="0.2">
            <span className="span1"></span>
            <span className="span2"></span>
            <img src="/img/thumb/450-550.jpg" alt="" />
          </div>

          <div className="img_holder layer" data-depth="0.3">
            <img src="/img/thumb/450-550.jpg" alt="" />
            <div className="abs_img" data-bg-img="/img/home/photo.jpg" style={{ backgroundImage: 'url("/img/home/photo.jpg")' }}></div>
          </div>
        </div>
      </div>

    <div className="right_part">
      <div className="hero_title">
        <div className="hero_title__kicker">Portfolio</div>

        <h1>
          <span>Fashion</span>
          <span className="hero_title__secondary">Designer</span>
        </h1>

        <p className="hero_lead">
          Co-founder and Creative Director at MONOLOGUE. Creating womenswear
          collections that balance precise pattern-cutting with soft, effortless
          silhouettes.
        </p>

        <img src="/img/home/paley-sign-small.png" alt="Nadia Paley" />

        <div className="hero_actions">
          <NavLink to="/projects"><button className="hero-btn hero-btn--primary">View Projects</button></NavLink>
          <NavLink to="/contact"><button className="hero-btn hero-btn--ghost">Get in Touch</button></NavLink>
        </div>
      </div>
    </div>
      {/*<div className="right_part">
        <div className="hero_title">
          <h1>Fashion Designer</h1>
          <p>Cofounder and Creative director at <a href="https://monologue.fashion/" target="_blank">MONOLOGUE</a>. Senior Fashion Designer and stylist based in New York and Washington DC. Exceptional expertise from concept creation to showroom presentation.</p>
          <img src="/img/paley-sign-small.png" alt="Nadia Paley" />
        </div>
      </div>*/}
    </section>
  );
}
