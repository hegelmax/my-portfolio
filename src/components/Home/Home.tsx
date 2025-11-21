import { NavLink } from "react-router-dom";

import HeroSection 	from "../HeroSection/HeroSection";
import Philosophy 	from "../Philosophy/Philosophy";
import ProjectsGrid from "../Projects/ProjectsGrid/ProjectsGrid";

import './Home.scss';

export default function Home() {
  return (
	<>
      <HeroSection/>
	  <Philosophy/>
      <section className="home-projects">
        <div className="home-projects__inner">
          <div className="home-projects__header">
            <h2>Selected Projects</h2>
          </div>

          <ProjectsGrid selectedOnly={true} limit={6} />

          <div className="home-projects__actions">
            <NavLink to="/projects" className="btn-view-more">
              View All Projects →
            </NavLink>
          </div>
        </div>
      </section>
	</>
  );
}
