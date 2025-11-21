import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import "./ProjectsGrid.scss";

interface Project {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  coverImage: string;
  category?: string;
  selected?: boolean;
}

interface ProjectsGridProps {
  limit?: number | null;
  infinite?: boolean;
  selectedOnly?: boolean;
}

export default function ProjectsGrid({
  limit = null,
  infinite = false,
  selectedOnly = false,
}: ProjectsGridProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [visibleCount, setVisibleCount] = useState<number>(limit || 0);

  // Функция перемешивания (Fisher–Yates)
  const shuffleArray = (arr: Project[]): Project[] => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  useEffect(() => {
    fetch("/data/projects.json")
      .then((res) => res.json())
      .then((data: Project[]) => {
        let list = Array.isArray(data) ? data : [];

        // 1) Берём только selected, если нужно
        if (selectedOnly) {
          list = list.filter((p) => p.selected === true);
        }

        // 2) Перемешиваем всегда (только selected или все)
        list = shuffleArray(list);

        setProjects(list);

        if (limit) {
          setVisibleCount(limit);
        } else if (infinite) {
          // первоначальная загрузка infinite-режима
          setVisibleCount(Math.min(6, list.length));
        }
      })
      .catch((err) => console.error("Error loading projects:", err));
  }, [limit, infinite, selectedOnly]);

  // INFINITE SCROLL
  useEffect(() => {
    if (!infinite) return;

    const onScroll = () => {
      const atBottom =
        window.innerHeight + window.scrollY >=
        document.body.offsetHeight - 200;

      if (atBottom && visibleCount < projects.length) {
        setVisibleCount((c) => Math.min(c + 3, projects.length));
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [infinite, visibleCount, projects.length]);

  const visibleProjects = infinite
    ? projects.slice(0, visibleCount)
    : projects.slice(0, limit || projects.length);

  return (
    <div className="projects-grid">
      {visibleProjects.map((p) => (
        <Link
          to={`/projects/${p.slug}`}
          className="project-card"
          key={p.id}
        >
          <div className="project-card" key={p.id}>
            <div
              className="project-card__image"
              style={{ backgroundImage: `url(${p.coverImage})` }}
            />
            <div className="project-card__info">
              <div className="project-card__title">{p.title}</div>
              <div className="project-card__subtitle">{p.subtitle}</div>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

