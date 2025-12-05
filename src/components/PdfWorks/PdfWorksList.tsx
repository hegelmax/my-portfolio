import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchJsonCached } from "../../utils/fetchJsonCached";

import "./PdfWorks.scss";

type PdfWork = {
  title: string;
  slug: string;
  htmlPath: string;
  pagesDir: string;
  previewImage?: string;
  createdAt?: string;
  pageCount?: number;
};

const normalizeWorks = (data: any): PdfWork[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.works)) return data.works;
  return [];
};

const withTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

const PdfWorksList = () => {
  const [works, setWorks] = useState<PdfWork[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJsonCached("/data/pdf-works.json");
        setWorks(normalizeWorks(data).filter((w) => w.slug && w.htmlPath));
      } catch (e: any) {
        setError(e?.message || "Failed to load PDF works");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sortedWorks = useMemo(() => {
    return [...works].sort((a, b) => {
      const aDate = a.createdAt ? Date.parse(a.createdAt) : 0;
      const bDate = b.createdAt ? Date.parse(b.createdAt) : 0;
      return bDate - aDate;
    });
  }, [works]);

  return (
    <main className="page pdf-works-list">
      <div className="pdf-works-list__header">
        <div>
          <h1>PDF works</h1>
          {/*<p>Browse PDF-like views generated from page images. No PDFs are served — only the images and HTML wrapper.</p>*/}
        </div>
        <Link className="pdf-works-list__cta" to="/contact">
          Work together
        </Link>
      </div>

      {loading && <div className="pdf-works-list__status">Loading PDF works...</div>}
      {error && <div className="pdf-works-list__status pdf-works-list__status--error">{error}</div>}

      {!loading && !error && sortedWorks.length === 0 && (
        <div className="pdf-works-list__status">No PDF works published yet.</div>
      )}

      {!loading && !error && sortedWorks.length > 0 && (
        <div className="pdf-works-grid">
          {sortedWorks.map((work) => (
            <Link key={work.slug} className="pdf-work-card" to={`/works/pdf/${work.slug}`}>
                <div className="pdf-work-card__preview">
                  <div className="pdf-page-shell">
                    <img
                      src={work.previewImage || `${withTrailingSlash(work.pagesDir)}page-1.png`}
                      alt={work.title}
                      loading="lazy"
                    />
                  </div>
                </div>
              <div className="pdf-work-card__body">
                <div className="pdf-work-card__title">{work.title}</div>
                <div className="pdf-work-card__meta">
                  <span>{work.pageCount ? `${work.pageCount} pages` : "Image set"}</span>
                  {work.createdAt && (
                    <span aria-label="Created date">
                      {new Date(work.createdAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
};

export default PdfWorksList;
