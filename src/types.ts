export interface ScrapeResult {
  url: string;
  scrapedAt: string;
  page: {
    title: string;
    description: string;
    html: string;
  };
  text: {
    headings: string[];
    paragraphs: string[];
    links: { text: string; href: string }[];
    images: { alt: string; src: string }[];
  };
  custom: Record<string, string | string[]>;
}

export interface ScrapeResponse {
  success: boolean;
  data: ScrapeResult;
  error?: string;
}

export interface Selector {
  key: string;
  value: string;
}
