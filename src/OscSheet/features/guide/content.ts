import MiniSearch from "minisearch";
import { pages, searchIndex } from "virtual:osc-guide";
import { GUIDE_SEARCH_OPTIONS, type GuidePage, type GuideSearchDoc } from "./model";

export { pages };

export type GuideLocation = { page: string; section?: string };

export type HighlightPart = { text: string; match: boolean };

export type GuideSearchResult = {
  page: string;
  section: string;
  title: string;
  heading: HighlightPart[];
  snippet: HighlightPart[];
};

const SNIPPET_RADIUS = 70;

let index: MiniSearch<GuideSearchDoc> | null = null;
const loadIndex = () => (index ??= MiniSearch.loadJSON<GuideSearchDoc>(searchIndex, GUIDE_SEARCH_OPTIONS));

export function findPage(slug: string | undefined): GuidePage | undefined {
  return pages.find((p) => p.slug === slug);
}

export function parseLocation(target: string | undefined): GuideLocation {
  const [page = "", section] = (target ?? "").replace(/\.md(?=#|$)/, "").split("#");
  const found = findPage(page) ?? pages[0];
  return { page: found?.slug ?? "", section: section || undefined };
}

export const sectionDomId = (id: string) => `osc-guide-${id}`;

export function locationHref({ page, section }: GuideLocation): string {
  return `#guide/${page}${section ? `/${section}` : ""}`;
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function highlight(text: string, terms: string[]): HighlightPart[] {
  if (!terms.length || !text) return text ? [{ text, match: false }] : [];
  const pattern = new RegExp(`(${terms.map(escapeRegExp).join("|")})`, "gi");
  return text
    .split(pattern)
    .filter(Boolean)
    .map((part) => ({ text: part, match: terms.some((t) => t.toLowerCase() === part.toLowerCase()) }));
}

function snippet(text: string, terms: string[]): string {
  const lower = text.toLowerCase();
  const hits = terms.map((t) => lower.indexOf(t.toLowerCase())).filter((i) => i >= 0);
  const at = hits.length ? Math.min(...hits) : 0;
  const start = Math.max(0, at - SNIPPET_RADIUS);
  const end = Math.min(text.length, at + SNIPPET_RADIUS * 2);
  return `${start > 0 ? "…" : ""}${text.slice(start, end).trim()}${end < text.length ? "…" : ""}`;
}

export function searchGuide(query: string): GuideSearchResult[] {
  if (!query.trim()) return [];
  return loadIndex()
    .search(query)
    .map((hit) => {
      const terms = [...new Set([...hit.terms, ...hit.queryTerms])].sort((a, b) => b.length - a.length);
      return {
        page: hit.page as string,
        section: hit.section as string,
        title: hit.title as string,
        heading: highlight(hit.heading as string, terms),
        snippet: highlight(snippet(hit.text as string, terms), terms),
      };
    });
}
