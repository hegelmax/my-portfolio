export type Project = {
  id?: number | string;

  title: string;
  subtitle?: string;

  slug: string;
  category?: string;
  selected?: boolean;

  date?: string;        // "2024-10-01"
  location?: string;    // "New York, NY"
  client?: string;      // "MONOLOGUE"
  author?: string;      // "Nadia Paley"

  tags?: string[];      // ["editorial", ...]
  services?: string[];  // ["Concept & Direction", ...]
  description?: string[]; // массив параграфов

  coverImage?: string;  // для UI
  images?: string[];

  relatedIds?: (number | string)[];
  relatedSlugs?: string[];

  summary?: string;
  year?: string;
};


export type ProjectsState = {
  loading: boolean;
  error: string | null;
  items: Project[];
};

