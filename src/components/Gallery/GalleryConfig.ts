import Isotope from "isotope-layout";

export type Category = string;
export type FilterCategory = Category | "All";

export interface GalleryItem {
  id: string;
  title: string;
  image: string;
  category?: Category;
  categories?: Category[];
  tags: string[];
  format: "1:1" | "1:2" | "2:1" | "2:2";
}

export interface GalleryConfigShape {
  title: string;
  subtitle: string;
  filters: { label: string; value: string; route?: string }[];
  dataUrl?: string;
}

export interface GallerySectionProps {
  initialFilter?: FilterCategory;
  config: GalleryConfigShape;
  items?: GalleryItem[];
}

export const DEFAULT_ITEMS: GalleryItem[] = [
  {
    id: "1",
    title: "Silk Dress",
    image: "/img/portfolio/01.jpg",
    categories: ["Premium"],
    tags: ["premium", "demi-couture"],
    format: "1:2",
  },
  {
    id: "2",
    title: "Evening Couture",
    image: "/img/portfolio/02.jpg",
    categories: ["Premium"],
    tags: ["evening", "embroidery"],
    format: "2:1",
  },
  {
    id: "3",
    title: "RTW Look 01",
    image: "/img/portfolio/03.jpg",
    categories: ["Ready-to-Wear"],
    tags: ["rtw", "daywear"],
    format: "1:1",
  },
];

export const categoryClass = (category: Category) => `cat-${category}`;

export const formatClass = (format: GalleryItem["format"]) =>
  `ratio-${format.replace(":", "x")}`;

export const widthClass = (format: GalleryItem["format"]) =>
  format === "1:2" || format === "2:2" ? "grid-item--w2" : "";

export const applyLayout = (iso: Isotope | null) => {
  if (!iso) return;
  iso.reloadItems();
  iso.layout();
};
