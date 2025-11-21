import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { GalleryConfig } from "../types/galleries";

type GalleriesContextValue = {
  galleries: GalleryConfig[];
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
};

const GalleriesContext = createContext<GalleriesContextValue>({
  galleries: [],
  loading: true,
  error: null,
  reload: async () => {},
});

export const GalleriesProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [galleries, setGalleries] = useState<GalleryConfig[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const resp = await fetch("/api/admin/galleries/list.php");
      if (!resp.ok) {
        throw new Error("Failed to load galleries");
      }
      const data = await resp.json();
      setGalleries(Array.isArray(data.galleries) ? data.galleries : []);
    } catch (e: any) {
      setError(e?.message || "Failed to load galleries");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <GalleriesContext.Provider value={{ galleries, loading, error, reload: load }}>
      {children}
    </GalleriesContext.Provider>
  );
};

export const useGalleries = () => useContext(GalleriesContext);
