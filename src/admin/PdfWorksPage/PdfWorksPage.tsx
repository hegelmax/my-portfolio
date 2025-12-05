import React, { useEffect, useMemo, useState } from "react";
import {
  getDocument,
  GlobalWorkerOptions,
} from "pdfjs-dist";
import type { PDFDocumentProxy } from "pdfjs-dist/types/src/pdf";
import pdfjsWorker from "pdfjs-dist/build/pdf.worker.min.mjs?url";

import { useRequireAdminAuth } from "../useRequireAdminAuth";

import "./PdfWorksPage.scss";

GlobalWorkerOptions.workerSrc = new URL(pdfjsWorker, import.meta.url).toString();

type PdfWork = {
  title: string;
  slug: string;
  htmlPath: string;
  pagesDir: string;
  previewImage?: string;
  createdAt?: string;
  updatedAt?: string;
  pageCount?: number;
};

type PageState = {
  pageNumber: number;
  status: "pending" | "rendering" | "uploading" | "done" | "error";
  error?: string;
  imageUrl?: string;
  previewUrl?: string;
};

const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

const withTrailingSlash = (value: string) =>
  value.endsWith("/") ? value : `${value}/`;

async function renderPageToBlob(pdf: PDFDocumentProxy, pageNumber: number) {
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1.6 });
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser");

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  await page.render({ canvasContext: ctx, viewport, canvas }).promise;

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Failed to encode page to PNG"))),
      "image/png",
    );
  });

  const previewUrl = URL.createObjectURL(blob);

  page.cleanup();
  canvas.width = 0;
  canvas.height = 0;

  return { blob, previewUrl };
}

async function uploadPage(slug: string, pageNumber: number, blob: Blob) {
  const formData = new FormData();
  formData.append("slug", slug);
  formData.append("pageNumber", String(pageNumber));
  formData.append("file", blob, `page-${pageNumber}.png`);

  const resp = await fetch("/api/admin/pdf/upload-page", {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await resp.json();
  if (!resp.ok || !data.success) {
    throw new Error(data?.error || "Failed to upload page");
  }

  return data.imageUrl as string;
}

async function saveHtml(payload: {
  title: string;
  slug: string;
  html: string;
  pageCount: number;
  previewImage?: string;
}) {
  const resp = await fetch("/api/admin/pdf/save-html", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await resp.json();
  if (!resp.ok || !data.success) {
    throw new Error(data?.error || "Failed to save HTML");
  }
  return data.work as PdfWork;
}

const PdfWorksPage: React.FC = () => {
  const authReady = useRequireAdminAuth();

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const [pages, setPages] = useState<PageState[]>([]);
  const [htmlSnippet, setHtmlSnippet] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [works, setWorks] = useState<PdfWork[]>([]);

  const completedCount = useMemo(
    () => pages.filter((p) => p.status === "done").length,
    [pages],
  );

  const resetPreviews = () => {
    pages.forEach((p) => {
      if (p.previewUrl) {
        URL.revokeObjectURL(p.previewUrl);
      }
    });
  };

  useEffect(() => () => resetPreviews(), [pages]);

  useEffect(() => {
    if (!authReady) return;

    const loadWorks = async () => {
      try {
        const resp = await fetch("/data/pdf-works.json", { credentials: "include" });
        const data = await resp.json();
        const list = Array.isArray(data) ? data : Array.isArray(data?.works) ? data.works : [];
        setWorks(list);
      } catch {
        // ignore fetch errors here; shown later when saving
      }
    };

    loadWorks();
  }, [authReady]);

  if (!authReady) {
    return <div className="pdf-works-page">Checking access...</div>;
  }

  const handleFileChange = (nextFile: File | null) => {
    setFile(nextFile);
    if (nextFile) {
      const nameWithoutExt = nextFile.name.replace(/\.pdf$/i, "");
      if (!title) setTitle(nameWithoutExt);
      if (!slug) setSlug(sanitizeSlug(nameWithoutExt));
    }
  };

  const updatePageState = (pageNumber: number, patch: Partial<PageState>) => {
    setPages((prev) =>
      prev.map((p) => (p.pageNumber === pageNumber ? { ...p, ...patch } : p)),
    );
  };

  const buildHtml = (imageUrls: string[]) => {
    const body = imageUrls
      .map(
        (url) =>
          `  <div class="pdf-page"><img src="${url}" loading="lazy" alt="PDF page" /></div>`,
      )
      .join("\n");
    return `<div class="pdf-view">\n${body}\n</div>`;
  };

  const handleReset = () => {
    resetPreviews();
    setPages([]);
    setHtmlSnippet("");
    setStatus(null);
    setError(null);
    setProcessing(false);
    setFile(null);
  };

  const handleProcess = async () => {
    if (!file) {
      setError("Choose a PDF first");
      return;
    }
    if (!slug) {
      setError("Slug is required");
      return;
    }
    if (!title) {
      setError("Title is required");
      return;
    }

    setProcessing(true);
    setStatus("Rendering pages...");
    setError(null);
    resetPreviews();

    let pdfDoc: PDFDocumentProxy | null = null;

    try {
      const pdfArray = await file.arrayBuffer();
      pdfDoc = await getDocument({ data: pdfArray }).promise;

      const initialPages: PageState[] = Array.from(
        { length: pdfDoc.numPages },
        (_, i) => ({ pageNumber: i + 1, status: "pending" }),
      );
      setPages(initialPages);

      const imageUrls: string[] = [];

      for (let i = 1; i <= pdfDoc.numPages; i++) {
        try {
          updatePageState(i, { status: "rendering" });
          const { blob, previewUrl } = await renderPageToBlob(pdfDoc, i);
          updatePageState(i, { status: "uploading", previewUrl });

          const imageUrl = await uploadPage(slug, i, blob);
          imageUrls.push(imageUrl);
          updatePageState(i, { status: "done", imageUrl });
        } catch (pageError: any) {
          updatePageState(i, { status: "error", error: pageError?.message || "Failed to upload page" });
          throw pageError;
        }
      }

      const html = buildHtml(imageUrls);
      setHtmlSnippet(html);
      setStatus("Uploading HTML...");

      const saved = await saveHtml({
        title,
        slug,
        html,
        pageCount: pdfDoc.numPages,
        previewImage: imageUrls[0],
      });

      setStatus("Saved. HTML + JSON entry updated.");
      setWorks((prev) => {
        const without = prev.filter((w) => w.slug !== saved.slug);
        return [saved, ...without];
      });
    } catch (e: any) {
      setError(e?.message || "Failed to process PDF");
    } finally {
      if (pdfDoc) {
        pdfDoc.destroy();
      }
      setProcessing(false);
    }
  };

  return (
    <div className="pdf-works-page">
      <div className="pdf-works-page__header">
        <div>
          <h1>PDF works</h1>
          <p>Create PDF-like views without uploading the original PDF. Pages render in the browser, get pushed as PNGs, then stitched into HTML.</p>
        </div>
        <div className="pdf-works-page__actions">
          <button className="btn-secondary" type="button" onClick={handleReset}>
            Reset
          </button>
          <button className="btn-primary" type="button" disabled={processing} onClick={handleProcess}>
            {processing ? "Processing..." : "Render & upload"}
          </button>
        </div>
      </div>

      <section className="pdf-works-form">
        <div className="form-grid">
          <label className="form-field">
            <span>Title</span>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Lookbook SS25"
              disabled={processing}
            />
          </label>
          <label className="form-field">
            <span>Slug (folder & URL)</span>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(sanitizeSlug(e.target.value))}
              placeholder="lookbook-ss25"
              disabled={processing}
            />
          </label>
          <label className="form-field form-field--file">
            <span>PDF file (processed client-side)</span>
            <input
              type="file"
              accept="application/pdf"
              onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
              disabled={processing}
            />
            {!file && <small>Original PDF never leaves the browser.</small>}
            {file && (
              <small>
                Selected: {file.name} ({Math.ceil(file.size / 1024)} KB)
              </small>
            )}
          </label>
        </div>

        <div className="form-notes">
          <div className="pill">Step 1: render pages in the browser</div>
          <div className="pill">Step 2: upload PNGs to /pdf/pages/{slug || "slug"}</div>
          <div className="pill">Step 3: save HTML to /pdf/html/{slug || "slug"}.html</div>
        </div>

        <div className="status-row">
          {status && <div className="status status--ok">{status}</div>}
          {error && <div className="status status--error">{error}</div>}
          {pages.length > 0 && (
            <div className="status status--muted">
              {completedCount}/{pages.length} pages ready
            </div>
          )}
        </div>
      </section>

      {pages.length > 0 && (
        <section className="pdf-works-progress">
          <header>
            <div>
              <h2>Page uploads</h2>
              <p>Each page renders to PNG locally, then uploads to the server.</p>
            </div>
            <div className="progress-chip">
              {completedCount}/{pages.length}
            </div>
          </header>

          <div className="pages-grid">
            {pages.map((page) => (
              <article key={page.pageNumber} className="page-card">
                <div className="page-card__top">
                  <div className="page-number">Page {page.pageNumber}</div>
                  <span className={`badge badge--${page.status}`}>
                    {page.status}
                  </span>
                </div>
                {page.previewUrl && (
                  <div className="page-preview">
                    <img src={page.previewUrl} alt={`Page ${page.pageNumber}`} />
                  </div>
                )}
                <div className="page-meta">
                  {page.imageUrl ? <code>{page.imageUrl}</code> : <span>Waiting...</span>}
                  {page.error && <span className="error">{page.error}</span>}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {htmlSnippet && (
        <section className="html-preview">
          <div className="html-preview__header">
            <h2>Generated HTML</h2>
            <p>Saved to /pdf/html/{slug}.html and exposed at the public route.</p>
          </div>
          <pre>{htmlSnippet}</pre>
        </section>
      )}

      {works.length > 0 && (
        <section className="pdf-works-existing">
          <div className="pdf-works-existing__header">
            <div>
              <h2>Existing PDF works</h2>
              <p>Loaded from /data/pdf-works.json.</p>
            </div>
            <a className="btn-secondary" href="/works/pdf">
              View public list
            </a>
          </div>
          <div className="works-grid">
            {works.map((work) => (
              <article key={work.slug} className="work-card">
                <div className="work-card__preview">
                  <img
                    src={work.previewImage || `${withTrailingSlash(work.pagesDir)}page-1.png`}
                    alt={work.title}
                  />
                </div>
                <div className="work-card__body">
                  <div className="work-card__title">{work.title}</div>
                  <div className="work-card__meta">
                    <code>{work.slug}</code>
                    {work.pageCount ? <span>{work.pageCount} pages</span> : null}
                  </div>
                  <div className="work-card__links">
                    <a href={`/works/pdf/${work.slug}`} target="_blank" rel="noreferrer">
                      View
                    </a>
                    <a href={work.htmlPath} target="_blank" rel="noreferrer">
                      HTML
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

export default PdfWorksPage;
