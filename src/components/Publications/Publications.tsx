import { useEffect, useState } from "react";
import GallerySection from "../Gallery/Gallery";

export default function Publications({initialFilter = "All"}) {
  const [config, setConfig] = useState(null);

  useEffect(() => {
    fetch("/data/publications-config.json")
      .then(r => r.json())
      .then(setConfig);
  }, []);

  if (!config) return null;

  return (
    <GallerySection
      initialFilter={initialFilter}
      config={config}
    />
  );
}

