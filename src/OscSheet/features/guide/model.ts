import type { Options } from "minisearch";

export type GuideText = { type: "text"; value: string };

export type GuideNode =
  | GuideText
  | { type: "break" | "thematicBreak" }
  | { type: "inlineCode"; value: string }
  | { type: "code"; value: string; lang?: string }
  | { type: "image"; src: string; alt: string }
  | { type: "heading"; depth: number; id: string; children: GuideNode[] }
  | {
      type: "paragraph" | "blockquote" | "emphasis" | "strong" | "delete" | "tableRow" | "tableCell";
      children: GuideNode[];
    }
  | { type: "list"; ordered: boolean; start?: number; children: GuideNode[] }
  | { type: "listItem"; checked?: boolean; children: GuideNode[] }
  | { type: "table"; align: ("left" | "right" | "center" | null)[]; children: GuideNode[] }
  | { type: "link"; target: GuideLinkTarget; children: GuideNode[] };

export type GuideLinkTarget =
  | { kind: "page"; page: string; section?: string }
  | { kind: "external"; url: string };

export type GuideHeading = { depth: number; id: string; text: string };

export type GuidePage = {
  slug: string;
  title: string;
  order: number;
  summary: string;
  tags: string[];
  headings: GuideHeading[];
  body: GuideNode[];
};

export type GuideSearchDoc = {
  id: string;
  page: string;
  section: string;
  title: string;
  heading: string;
  text: string;
  tags: string;
};

export const GUIDE_SEARCH_OPTIONS: Options<GuideSearchDoc> = {
  fields: ["title", "heading", "text", "tags"],
  storeFields: ["page", "section", "title", "heading", "text"],
  searchOptions: {
    boost: { title: 3, heading: 2, tags: 1.5 },
    prefix: true,
    fuzzy: 0.2,
    combineWith: "AND",
  },
};
