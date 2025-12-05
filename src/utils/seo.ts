export type SeoEntry = {
  title?: string;
  description?: string;
  keywords?: string;
  author?: string;
  og?: {
    title?: string;
    description?: string;
    type?: string;
    url?: string;
    image?: string;
  };
  twitter?: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
  };
};

export type SeoConfig = {
  default?: SeoEntry;
  pages?: Record<string, SeoEntry>;
};

const defaultSeoUrl = "/data/seo.json";

function upsertMetaTag(
  identifier: { name?: string; property?: string },
  content?: string | null,
) {
  if (!content) return;
  const selector = identifier.name
    ? `meta[name="${identifier.name}"]`
    : `meta[property="${identifier.property}"]`;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    if (identifier.name) {
      tag.name = identifier.name;
    }
    if (identifier.property) {
      tag.setAttribute("property", identifier.property);
    }
    document.head.appendChild(tag);
  }
  tag.content = content;
}

function resolveSeoForPath(config: SeoConfig, path: string): SeoEntry | null {
  if (!config) return null;

  const pages = config.pages || {};
  const byPath: SeoEntry | undefined = pages[path] || pages[path.replace(/\/$/, "")];
  const root: SeoEntry | undefined = pages["/"] || pages["default"];
  const fallback: SeoEntry | undefined = config.default;

  return byPath || root || fallback || null;
}

export function applySeoConfig(entry: SeoEntry) {
  if (!entry) return;

  if (entry.title) {
    document.title = entry.title;
  }

  upsertMetaTag({ name: "description" }, entry.description);
  upsertMetaTag({ name: "keywords" }, entry.keywords);
  upsertMetaTag({ name: "author" }, entry.author);

  if (entry.og) {
    upsertMetaTag({ property: "og:title" }, entry.og.title ?? entry.title);
    upsertMetaTag(
      { property: "og:description" },
      entry.og.description ?? entry.description,
    );
    upsertMetaTag({ property: "og:type" }, entry.og.type ?? "website");
    upsertMetaTag({ property: "og:url" }, entry.og.url ?? window.location.href);
    upsertMetaTag({ property: "og:image" }, entry.og.image);
  }

  if (entry.twitter) {
    upsertMetaTag(
      { name: "twitter:card" },
      entry.twitter.card ?? "summary_large_image",
    );
    upsertMetaTag(
      { name: "twitter:title" },
      entry.twitter.title ?? entry.title,
    );
    upsertMetaTag(
      { name: "twitter:description" },
      entry.twitter.description ?? entry.description,
    );
    upsertMetaTag(
      { name: "twitter:image" },
      entry.twitter.image ?? entry.og?.image,
    );
  }
}

import { fetchJsonCached } from "./fetchJsonCached";

export async function loadSeoConfig(url: string = defaultSeoUrl): Promise<SeoConfig | null> {
  try {
    const json = await fetchJsonCached<SeoConfig>(url, { credentials: "omit" });
    return json ?? null;
  } catch (err) {
    console.warn("SEO: unable to load config", err);
    return null;
  }
}

export async function loadAndApplySeoConfig(url?: string) {
  const config = await loadSeoConfig(url);
  if (config) {
    const entry = resolveSeoForPath(config, window.location.pathname);
    if (entry) {
      applySeoConfig(entry);
    }
  }
  return config;
}
