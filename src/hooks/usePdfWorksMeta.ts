import { useEffect, useState } from "react";
import { fetchJsonCached } from "../utils/fetchJsonCached";

type PdfWorkMeta = {
  slug?: string;
  htmlPath?: string;
};

const normalize = (data: any): PdfWorkMeta[] => {
  if (Array.isArray(data)) return data;
  if (data && Array.isArray(data.works)) return data.works;
  return [];
};

export const usePdfWorksMeta = () => {
  const [works, setWorks] = useState<PdfWorkMeta[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchJsonCached("/data/pdf-works.json")
      .then((json) => {
        if (!mounted) return;
        const items = normalize(json).filter((w) => w.slug && w.htmlPath);
        setWorks(items);
        setLoading(false);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load PDF works");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    works,
    loading,
    error,
    hasWorks: works.length > 0,
  };
};
