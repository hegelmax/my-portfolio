import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./ProjectDetailsPage.scss";

interface Project {
  id: number;
  slug?: string;
  title: string;
  subtitle: string;
  coverImage: string;
  category?: string;
  selected?: number;
  date?: string;
  location?: string;
  client?: string;
  author?: string;
  tags?: string[];
  services?: string[];
  description?: string[];
  images?: string[];
  relatedIds?: number[];
  relatedSlugs?: string[];
}

export default function ProjectDetailsPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [projects, setProjects] = useState<Project[]>([]);
  const [project, setProject] = useState<Project | null>(null);

  const [activeIndex, setActiveIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  // грузим проекты и находим нужный по slug
  useEffect(() => {
    fetch("/data/projects.json")
      .then((res) => res.json())
      .then((data: Project[]) => {
        const list = Array.isArray(data) ? data : [];
        setProjects(list);

        const found = list.find((p) => p.slug === slug);

        if (found) {
          setProject(found);
          setActiveIndex(0);
          setIsLightboxOpen(false);
        } else {
          setProject(null);
        }
      })
      .catch((err) => {
        console.error("Error loading project:", err);
        setProject(null);
      });
  }, [slug]);

  // even if project is null – держим images как пустой массив
  let images: string[] = [];

  if (project) {
    const gallery = Array.isArray(project.images) ? project.images : [];
    const cover = project.coverImage;

    if (cover) {
      // coverImage — всегда первый
      images = [cover, ...gallery.filter((src) => src !== cover)];
    } else {
      images = gallery;
    }
  }

  /*const related: Project[] =
    project && project.relatedSlugs && project.relatedSlugs.length > 0
      ? projects
          .filter((p) => p.slug && project.relatedSlugs!.includes(p.slug))
          .slice(0, 4)
      : [];*/
  const related =
    project?.relatedIds && project.relatedIds.length > 0
      ? projects.filter((p) => project.relatedIds!.includes(p.id)).slice(0, 4)
      : [];


  const openLightbox = (index: number) => {
    if (!images.length) return;
    setActiveIndex(index);
    setIsLightboxOpen(true);
  };

  const closeLightbox = () => {
    setIsLightboxOpen(false);
  };

  const showNext = () => {
    if (!images.length) return;
    setActiveIndex((prev) => (prev + 1) % images.length);
  };

  const showPrev = () => {
    if (!images.length) return;
    setActiveIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  // управление стрелками и Esc — хук ВСЕГДА вызывается, но внутри есть guard
  useEffect(() => {
    if (!isLightboxOpen || !images.length) return;

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight") showNext();
      if (e.key === "ArrowLeft") showPrev();
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isLightboxOpen, images.length]);

  // fallback, если проект не найден
  if (!project) {
    return (
      <section className="project-page">
        <div className="project-page__inner">
          <button className="project-page__back" onClick={() => navigate(-1)}>
            ← Back
          </button>
          <p>Project not found.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="project-page">
      <div className="project-page__inner">

        <button className="project-page__back" onClick={() => navigate(-1)}>
          ← Back to Projects
        </button>

        {/* Заголовок */}
        <header className="project-page__header">
          <div>
            <h1 className="project-page__title">{project.title}</h1>
            {project.subtitle && (
              <div className="project-page__subtitle">{project.subtitle}</div>
            )}
          </div>
        </header>

        {/* Основной блок: картинки + данные */}
        <div className="project-page__main">
          {/* ГАЛЕРЕЯ */}
          <div className="project-page__gallery">
            {/* Главная большая картинка */}
            <div
              className="project-page__main-image"
              onClick={() => openLightbox(activeIndex)}
            >
              <img
                src={images[activeIndex]}
                alt={`${project.title} ${activeIndex + 1}`}
              />
            </div>

            {/* Лента превью */}
            {images.length > 1 && (
              <div className="project-page__thumbs">
                {images.map((src, idx) => (
                  <button
                    type="button"
                    key={idx}
                    className={
                      "project-page__thumb" +
                      (idx === activeIndex ? " project-page__thumb--active" : "")
                    }
                    onClick={() => setActiveIndex(idx)}
                  >
                    <img src={src} alt={`Thumbnail ${idx + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Правая колонка - данные и описание */}
          <aside className="project-page__sidebar">
            <section className="project-page__data">
              {/*<h2 className="project-page__data-title">Project Data</h2>*/}

              <dl className="project-page__data-list">
                {project.date && (
                  <>
                    <dt>Date:</dt>
                    <dd>{new Date(project.date).toLocaleDateString()}</dd>
                  </>
                )}
                {project.category && (
                  <>
                    <dt>Category:</dt>
                    <dd>{project.category}</dd>
                  </>
                )}
                {project.tags && project.tags.length > 0 && (
                  <>
                    <dt>Tags:</dt>
                    <dd>{project.tags.join(", ")}</dd>
                  </>
                )}
                {project.author && (
                  <>
                    <dt>Author:</dt>
                    <dd>{project.author}</dd>
                  </>
                )}
                {project.client && (
                  <>
                    <dt>Client:</dt>
                    <dd>{project.client}</dd>
                  </>
                )}
                {project.location && (
                  <>
                    <dt>Location:</dt>
                    <dd>{project.location}</dd>
                  </>
                )}
              </dl>

              {project.description && project.description.length > 0 && (
                <div className="project-page__description">
                  {project.description.map((para, idx) => (
                    <p key={idx}>{para}</p>
                  ))}
                </div>
              )}
            </section>

            <section className="project-page__meta">
              {project.services && project.services.length > 0 && (
                <div className="project-page__block">
                  <h3>Services</h3>
                  <ul>
                    {project.services.map((s, idx) => (
                      <li key={idx}>{s}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="project-page__block">
                <h3>Share</h3>
                <div className="project-page__share">
                  <button aria-label="Share on Facebook">Fb</button>
                  <button aria-label="Share on Instagram">Ig</button>
                  <button aria-label="Share on Pinterest">Pi</button>
                </div>
              </div>
            </section>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="project-page__related">
            <h2 className="project-page__related-title">Related Projects</h2>

            <div className="project-page__related-grid">
              {related.map((r) => (
                <Link
                  key={r.id}
                  to={`/projects/${r.slug}`}
                  className="related-card"
                >
                  <div
                    className="related-card__image"
                    style={{ backgroundImage: `url(${r.coverImage})` }}
                  />
                  <div className="related-card__info">
                    <div className="related-card__title">{r.title}</div>
                    <div className="related-card__subtitle">
                      {r.subtitle}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
        {isLightboxOpen && (
          <div className="project-page__lightbox" onClick={closeLightbox}>
            <div
              className="project-page__lightbox-inner"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="project-page__lightbox-close"
                onClick={closeLightbox}
                aria-label="Close"
              >
                ×
              </button>

              {images.length > 1 && (
                <>
                  <button
                    className="project-page__lightbox-nav project-page__lightbox-nav--prev"
                    onClick={showPrev}
                    aria-label="Previous image"
                  >
                    ‹
                  </button>
                  <button
                    className="project-page__lightbox-nav project-page__lightbox-nav--next"
                    onClick={showNext}
                    aria-label="Next image"
                  >
                    ›
                  </button>
                </>
              )}

              <img
                src={images[activeIndex]}
                alt={`${project.title} large ${activeIndex + 1}`}
                className="project-page__lightbox-img"
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
