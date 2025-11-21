import { useEffect, useState } from "react";
import type { MediaLibraryItem } from "../types/galleries";

let mediaCache: MediaLibraryItem[] | null = null;
let mediaPromise: Promise<MediaLibraryItem[]> | null = null;

const loadMedia = async () => {
  if (mediaCache) {
    return mediaCache;
  }
  if (!mediaPromise) {
    mediaPromise = fetch("/api/admin/media/list", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        page: 1,
        pageSize: 5000,
      }),
    })
      .then((resp) => {
        if (!resp.ok) {
          throw new Error("Failed to load media");
        }
        return resp.json();
      })
      .then((data) => {
        const items = Array.isArray(data.items) ? data.items : [];
        mediaCache = items;
        mediaPromise = null;
        return items;
      })
      .catch((err) => {
        mediaPromise = null;
        throw err;
      });
  }
  return mediaPromise;
};

export const useMediaLibrary = () => {
  const [items, setItems] = useState<MediaLibraryItem[]>(mediaCache ?? []);
  const [loading, setLoading] = useState<boolean>(!mediaCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (mediaCache) return;
    let mounted = true;
    loadMedia()
      .then((data) => {
        if (!mounted) return;
        setItems(data);
        setLoading(false);
      })
      .catch((e: any) => {
        if (!mounted) return;
        setError(e?.message || "Failed to load media");
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  return { items, loading, error };
};
