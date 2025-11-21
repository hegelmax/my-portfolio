import './Philosophy.scss';
import { NavLink } from "react-router-dom";

export default function Philosophy() {
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
          <div className="philosophy__card">
			<img src='/img/home/mannequin_640.jpg' />
		  </div>
          <div className="philosophy__card">
            <img src='/img/home/scatch_640.jpg' />
          </div>
        </div>

      </div>
    </section>
  );
}
