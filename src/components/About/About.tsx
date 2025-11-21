import React from "react";

import './About.scss';

const About: React.FC = () => {
  return (
    <main className="page page--about">
      <div className="page--about__inner">{/*<div className="container container--narrow">*/}
        {/* Top heading + short intro */}
        <header className="about-header">
          <h1 className="about-header__title">About</h1>
          <p className="about-header__intro">
            Nadia Paley is a Senior Fashion Designer and stylist projecting between
            the United States and France. She creates womenswear collections and
            editorial looks that balance precise pattern-cutting with soft,
            effortless silhouettes.
          </p>
        </header>

        {/* Hero image block */}
        <section className="about-hero">
          <div className="about-hero__image">
            {/* Заменить src на своё изображение */}
            <img
              src="/img/about/runway.jpg"
              alt="Minimal fashion studio projectspace"
            />
          </div>
        </section>

        {/* Main story block */}
        <section className="about-story">
          <h2 className="about-story__title">From Sketch to Showroom</h2>
          <p className="about-story__text">
            At <a href="https://monologue.fashion" target="_blank">MONOLOGUE</a>, Nadia leads premium womenswear collections from the
            first sketch to showroom presentation: concept, fabric stories,
            fittings, sampling and production. Her pieces have been shown at
            Paris Fashion Week and international trade shows, building long-term
            partnerships with boutique retailers.
          </p>
          <p className="about-story__text">
            Alongside collection project, she consults private clients through <a href="https://renew.style" target="_blank">RENEW.STYLE</a>, creating smart, realistic wardrobes for everyday life,
            events and editorial projects. Each look is built around the
            client’s body, lifestyle and personality, not just trends.
          </p>
        </section>

        {/* Four “pillars” / focus areas */}
        <section className="about-pillars">
          <div className="about-pillars__item">
            <h3 className="about-pillars__title">Womenswear Design</h3>
            <p className="about-pillars__text">
              Timeless silhouettes in natural fabrics, designed to feel
              effortless and flattering from every angle.
            </p>
          </div>
          <div className="about-pillars__item">
            <h3 className="about-pillars__title">Editorial Styling</h3>
            <p className="about-pillars__text">
              Looks for campaigns, covers and stories where the clothes support
              the narrative instead of shouting over it.
            </p>
          </div>
          <div className="about-pillars__item">
            <h3 className="about-pillars__title">Wardrobe Strategy</h3>
            <p className="about-pillars__text">
              Clear structure for a projecting wardrobe: key pieces, smart updates
              and styling formulas that last.
            </p>
          </div>
          <div className="about-pillars__item">
            <h3 className="about-pillars__title">Production Mindset</h3>
            <p className="about-pillars__text">
              A designer who speaks the language of factories, margins and
              timelines as fluently as moodboards.
            </p>
          </div>
        </section>

        {/* Approach block with side image, like in the reference */}
        <section className="about-approach">
          <div className="about-approach__image">
            {/* Заменить src на своё изображение */}
            <img
              src="/img/about/window-tree-min.jpg"
              alt="Soft natural light in a studio window"
            />
          </div>

          <div className="about-approach__content">
            <h2 className="about-approach__title">My Approach</h2>
            <p className="about-approach__text">
              I believe that good design is quiet confidence. No loud logos,
              only refined construction, beautiful fabrics and details that are
              discovered up close.
            </p>
            <p className="about-approach__text">
              Every project starts with listening: to the client, to the brief,
              to the way the garment should move on a real body. From there I
              build a clear concept, translate it into sketches and technical
              documentation, and guide it all the way through fittings and
              production.
            </p>
            <p className="about-approach__text">
              The result is clothes and looks that feel current today, but are
              still relevant in years to come.
            </p>

            <div className="about-approach__links">
              <a href="/portfolio" className="about-approach__link">
                View Portfolio
              </a>
              <a href="/contact" className="about-approach__link">
                Contact Nadia
              </a>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
};

export default About;

