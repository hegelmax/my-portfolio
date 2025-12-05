import "./Philosophy.scss";
import { NavLink } from "react-router-dom";
import { useEffect, useRef } from "react";

const HORIZ_SHIFT_PX = 80; // setting: max horizontal shift (px)
const SHIFT_SENSITIVITY = 0.6; // setting: scroll sensitivity (0..1+)

export default function Philosophy() {
  const topRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handleScroll = () => {
      const cards = [
        { ref: topRef, direction: 1 },
        { ref: bottomRef, direction: -1 },
      ];
      cards.forEach(({ ref, direction }) => {
        const el = ref.current;
        if (!el) return;
        const rect = el.getBoundingClientRect();
        const viewportH = window.innerHeight || 1;
        // normalize section position within viewport
        const progress = Math.min(
          1,
          Math.max(0, 1 - rect.top / viewportH),
        );
        const shift = direction * HORIZ_SHIFT_PX * progress * SHIFT_SENSITIVITY;
        el.style.transform = `translateX(${shift}px)`;
      });
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  return (
    <section className="philosophy">
      <div className="philosophy__inner">
        
        {/* LEFT TEXT */}
        <div className="philosophy__text">
          <h2 className="philosophy__title">The Philosophy</h2>

          <p className="philosophy__lead">
            Fashion is not just about clothing; it’s about the narrative we construct 
            around ourselves. My project explores the intersection of architectural structure 
            and organic fluidity.
          </p>

          <p className="philosophy__lead">
            Based in New York and Washington DC, I specialize in concept creation, 
            showroom presentation, and sustainable material sourcing.
          </p>

          <NavLink className="philosophy__link" to="/about">
            Read full bio →
          </NavLink>
        </div>

        {/* RIGHT IMAGES / CARDS */}
        <div className="philosophy__visuals">
          <div className="philosophy__card" ref={topRef}>
			<img src='/img/home/mannequin_640.jpg' />
		  </div>
          <div className="philosophy__card" ref={bottomRef}>
            <img src='/img/home/scatch_640.jpg' />
          </div>
        </div>

      </div>
    </section>
  );
}
