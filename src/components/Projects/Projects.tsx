import ProjectsGrid from "./ProjectsGrid/ProjectsGrid";
import './Projects.scss';

export default function Projects() {
  return (
    <section className="projects-page">
      <div className="projects-page__header">
        <h1>All Projects</h1>
      </div>

      <ProjectsGrid infinite={true} />
    </section>
  );
}
