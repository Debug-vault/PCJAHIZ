export type ProductCardData = {
  id: string;
  slug: string;
  nameFr: string;
  summaryFr: string | null;
  descriptionFr: string | null;
  price: number;
  oldPrice: number | null;
  discount: number | null;
  img: string | null;
  brandSlug: string | null;
  categorySlug: string | null;
  stock: number;
  featured: boolean;
  isNew: boolean;
  popularity: number;
  warrantyMonths: number;
  specs: { k: string; v: string }[];
};

export type ProductVariantType = "color" | "ram" | "storage" | "processor" | "screen" | "os" | "gpu" | "finish" | "size" | "capacity";

export type ProductVariantOption = {
  label: string;
  value: string;
  hex?: string;
  image?: string;
  priceDiff?: number;
  stock?: number;
  sku?: string;
};

export type ProductVariant = {
  type: ProductVariantType;
  label: string;
  options: ProductVariantOption[];
};

export type ProductSection = {
  id: string;
  title: string;
  icon: string;
  text: string;
  visual: {
    type: "gauges" | "bars" | "icons" | "specs-grid";
    items: { label: string; value: number; max?: number; icon?: string }[];
  } | null;
};

export type ProductDetailData = {
  product: {
    id: string;
    slug: string;
    sku: string;
    nameFr: string;
    summaryFr: string | null;
    descriptionFr: string | null;
    seoTitleFr: string | null;
    seoDescriptionFr: string | null;
    faqFr: { q: string; a: string }[] | null;
    brandSlug: string | null;
    categorySlug: string | null;
    price: number;
    oldPrice: number | null;
    discount: number | null;
    currency: string;
    img: string | null;
    images: string[];
    specs: { k: string; v: string }[] | null;
    sectionsFr: ProductSection[] | null;
    variants: ProductVariant[] | null;
    stock: number;
    featured: boolean;
    isNew: boolean;
    popularity: number;
    warrantyMonths: number;
  };
  similar: ProductCardData[];
  reviews: {
    id: string;
    author: string;
    city: string | null;
    rating: number;
    comment: string;
    createdAt: Date;
  }[];
};