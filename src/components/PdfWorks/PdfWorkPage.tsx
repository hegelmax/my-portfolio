import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchJsonCached, fetchTextCached } from "../../utils/fetchJsonCached";

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

const PdfWorkPage = () => {
  const { slug } = useParams();
  const [work, setWork] = useState<PdfWork | null>(null);
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    const loadWork = async () => {
      setError(null);
      setLoading(true);
      try {
        const data = await fetchJsonCached("/data/pdf-works.json");
        const found = normalizeWorks(data).find((w) => w.slug === slug);
        if (!found) {
          setError("PDF work not found.");
          setWork(null);
          setLoading(false);
          return;
        }
        setWork(found);

        const htmlText = await fetchTextCached(found.htmlPath);
        setHtml(htmlText);
      } catch (e: any) {
        setError(e?.message || "Failed to load PDF");
      } finally {
        setLoading(false);
      }
    };

    loadWork();
  }, [slug]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  if (loading) {
    return (
      <main className="page pdf-work-view">
        <div className="pdf-work-view__status">Loading PDF...</div>
      </main>
    );
  }

  if (error || !work) {
    return (
      <main className="page pdf-work-view">
        <div className="pdf-work-view__status pdf-work-view__status--error">{error || "PDF work not found."}</div>
        <Link to="/works/pdf" className="pdf-work-view__back">
          Back to PDF works
        </Link>
      </main>
    );
  }

  return (
    <main className="page pdf-work-view">
      <div className="pdf-work-view__header">
        <div>
          <h1>{work.title}</h1>
          {/*<p>Rendered PDF pages served as images. No PDF download available.</p>*/}
        </div>
        <Link to="/works/pdf" className="pdf-work-view__back">
          Back to PDF works
        </Link>
      </div>

      <div className="pdf-view-shell" dangerouslySetInnerHTML={{ __html: html }} />
    </main>
  );
};

export default PdfWorkPage;
