import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";

import HeroSection from "../HeroSection/HeroSection";
import Philosophy from "../Philosophy/Philosophy";
import ProjectsGrid from "../Projects/ProjectsGrid/ProjectsGrid";
import { fetchJsonCached } from "../../utils/fetchJsonCached";

import "./Home.scss";

declare global {
  interface Window {
    Snowfall?: any;
  }
}

type SnowConfig = {
  enabled?: boolean;
  count?: number;
  speed?: number;
  selector?: string;
};

const SnowLayer = ({ config }: { config: SnowConfig }) => {
  const { enabled, count, speed, selector } = config;
  useEffect(() => {
    if (!enabled) return;
    if (!window.Snowfall) return;
    const snow = new window.Snowfall({
      selector: selector || "global-outer",
      count: count ?? 150,
      speed: speed ?? 1,
    });
    return () => snow.destroy?.();
  }, [enabled, count, speed, selector]);
  return null;
};

export default function Home() {
  const [snowConfig, setSnowConfig] = useState<SnowConfig>({});

  useEffect(() => {
    fetchJsonCached<{ snowfall?: SnowConfig }>("/data/site-settings.json")
      .then((data) => {
        if (data?.snowfall && typeof data.snowfall === "object") {
          setSnowConfig(data.snowfall);
        }
      })
      .catch(() => {
        // if no settings file — snowfall stays disabled
      });
  }, []);

  return (
    <>
      <SnowLayer config={snowConfig} />
      <HeroSection />
      <Philosophy />
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
