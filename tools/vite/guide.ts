import fs from "node:fs";
import path from "node:path";
import type { Plugin } from "vite";
import type { Nodes, Root, RootContent } from "mdast";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { toString } from "mdast-util-to-string";
import GithubSlugger from "github-slugger";
import { parse as parseYaml } from "yaml";
import MiniSearch from "minisearch";
import {
  GUIDE_SEARCH_OPTIONS,
  type GuideHeading,
  type GuideLinkTarget,
  type GuideNode,
  type GuidePage,
  type GuideSearchDoc,
} from "../../src/OscSheet/features/guide/model";

const VIRTUAL_ID = "virtual:osc-guide";
const RESOLVED_ID = `\0${VIRTUAL_ID}`;
const FRONT_MATTER = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?/;
const PAGE_LINK = /^(?:\.\/)?([\w-]+)\.md(?:#([\w-]+))?$/;

type Source = { slug: string; file: string; meta: Omit<GuidePage, "slug" | "headings" | "body">; tree: Root };

export type CompiledGuide = { pages: GuidePage[]; searchIndex: string; images: string[]; problems: string[] };

function readFrontMatter(file: string, raw: string) {
  const match = FRONT_MATTER.exec(raw);
  const data = (match ? parseYaml(match[1]) : null) ?? {};
  if (typeof data.title !== "string" || !data.title.trim())
    throw new Error(`${file}: front matter needs a "title"`);
  return {
    meta: {
      title: data.title.trim(),
      order: typeof data.order === "number" ? data.order : Number.MAX_SAFE_INTEGER,
      summary: typeof data.summary === "string" ? data.summary.trim() : "",
      tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    },
    body: match ? raw.slice(match[0].length) : raw,
  };
}

function headingIds(tree: Root): Map<Nodes, string> {
  const slugger = new GithubSlugger();
  const ids = new Map<Nodes, string>();
  for (const node of tree.children)
    if (node.type === "heading") ids.set(node, slugger.slug(toString(node)));
  return ids;
}

export function compileGuide(dir: string): CompiledGuide {
  const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith(".md")) : [];
  const sources: Source[] = files.map((name) => {
    const file = path.join(dir, name);
    const { meta, body } = readFrontMatter(name, fs.readFileSync(file, "utf8"));
    const tree = fromMarkdown(body, { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] });
    return { slug: name.replace(/\.md$/, ""), file, meta, tree };
  });
  sources.sort((a, b) => a.meta.order - b.meta.order || a.meta.title.localeCompare(b.meta.title));

  const anchors = new Map(sources.map((s) => [s.slug, new Set(headingIds(s.tree).values())]));
  const images: string[] = [];
  const problems: string[] = [];
  const docs: GuideSearchDoc[] = [];

  const pages = sources.map(({ slug, file, meta, tree }) => {
    const ids = headingIds(tree);
    const where = path.basename(file);

    const linkTarget = (url: string): GuideLinkTarget | null => {
      if (/^(https?:|mailto:)/i.test(url)) return { kind: "external", url };
      const local = url.startsWith("#") ? { page: slug, section: url.slice(1) } : null;
      const match = local ? null : PAGE_LINK.exec(url);
      const target = local ?? (match ? { page: match[1], section: match[2] } : null);
      if (!target || !anchors.has(target.page)) {
        problems.push(`${where}: link "${url}" does not point at a guide page`);
        return null;
      }
      if (target.section && !anchors.get(target.page)!.has(target.section))
        problems.push(`${where}: link "${url}" names a missing section`);
      return { kind: "page", ...target };
    };

    const convert = (node: Nodes): GuideNode[] => {
      const kids = () => ("children" in node ? node.children.flatMap((c) => convert(c as Nodes)) : []);
      switch (node.type) {
        case "text":
          return [{ type: "text", value: node.value }];
        case "inlineCode":
          return [{ type: "inlineCode", value: node.value }];
        case "code":
          return [{ type: "code", value: node.value, lang: node.lang ?? undefined }];
        case "break":
        case "thematicBreak":
          return [{ type: node.type }];
        case "heading":
          return [{ type: "heading", depth: node.depth, id: ids.get(node) ?? "", children: kids() }];
        case "paragraph":
        case "blockquote":
        case "emphasis":
        case "strong":
        case "delete":
        case "tableRow":
        case "tableCell":
          return [{ type: node.type, children: kids() }];
        case "list":
          return [{ type: "list", ordered: !!node.ordered, start: node.start ?? undefined, children: kids() }];
        case "listItem":
          return [{ type: "listItem", checked: node.checked ?? undefined, children: kids() }];
        case "table":
          return [{ type: "table", align: node.align ?? [], children: kids() }];
        case "link": {
          const target = linkTarget(node.url);
          return target ? [{ type: "link", target, children: kids() }] : kids();
        }
        case "image": {
          const src = path.resolve(dir, decodeURI(node.url));
          if (/^[a-z]+:/i.test(node.url) || !fs.existsSync(src)) {
            problems.push(`${where}: image "${node.url}" must be a file next to the guide pages`);
            return [];
          }
          images.push(src);
          return [{ type: "image", src: `\0img${images.length - 1}`, alt: node.alt ?? "" }];
        }
        default:
          return kids();
      }
    };

    const body = tree.children.flatMap((n) => convert(n));
    const headings: GuideHeading[] = [...ids].map(([node, id]) => ({
      depth: (node as { depth: number }).depth,
      id,
      text: toString(node),
    }));

    let section = { id: "", heading: meta.title, text: [] as string[] };
    const flush = () =>
      docs.push({
        id: `${slug}#${section.id}`,
        page: slug,
        section: section.id,
        title: meta.title,
        heading: section.heading,
        text: section.text.join(" ").replace(/\s+/g, " ").trim(),
        tags: meta.tags.join(" "),
      });
    for (const node of tree.children as RootContent[]) {
      if (node.type === "heading" && node.depth <= 3) {
        flush();
        section = { id: ids.get(node) ?? "", heading: toString(node), text: [] };
      } else section.text.push(toString(node));
    }
    flush();

    return { slug, ...meta, headings, body };
  });

  const search = new MiniSearch<GuideSearchDoc>(GUIDE_SEARCH_OPTIONS);
  search.addAll(docs);
  return { pages, searchIndex: JSON.stringify(search), images, problems };
}

function emitModule({ pages, searchIndex, images }: CompiledGuide): string {
  const imports = images.map((file, i) => `import img${i} from ${JSON.stringify(file)};`);
  const json = JSON.stringify(pages).replace(/"\\u0000img(\d+)"/g, (_, i) => `img${i}`);
  return `${imports.join("\n")}
export const pages = ${json};
export const searchIndex = ${JSON.stringify(searchIndex)};
`;
}

export function guidePlugin(dir: string): Plugin {
  return {
    name: "osc-guide",
    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_ID : null;
    },
    load(id) {
      if (id !== RESOLVED_ID) return null;
      const guide = compileGuide(dir);
      for (const page of guide.pages) this.addWatchFile(path.join(dir, `${page.slug}.md`));
      for (const problem of guide.problems) this.warn(problem);
      return emitModule(guide);
    },
    configureServer(server) {
      server.watcher.add(dir);
      const reload = (file: string) => {
        if (!file.startsWith(dir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.reloadModule(mod);
      };
      server.watcher.on("add", reload);
      server.watcher.on("change", reload);
      server.watcher.on("unlink", reload);
    },
  };
}
