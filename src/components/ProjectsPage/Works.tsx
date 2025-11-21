import ProjectsGrid from "../Projects/ProjectsGrid/ProjectsGrid";
import './ProjectsPage.scss';

export default function ProjectsPage() {
  return (
    <section className="projects-page">
      <div className="projects-page__header">
        <h1>All Projects</h1>
      </div>

      <ProjectsGrid infinite={true} />
    </section>
  );
}

