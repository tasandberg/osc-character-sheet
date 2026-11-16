export const TOME = "ose-advancedfantasytome";

export type ClassSet = "classic" | "advanced";

export type IndexEntry = {
  _id: string;
  name: string;
  type?: string;
  folder?: string | null;
  sort?: number;
  system?: { description?: string };
};

export type Pack = {
  collection: string;
  documentName: string;
  metadata: { label: string; packageName: string };
  folders: { contents: { id: string; name: string }[] };
  getIndex(options?: { fields: string[] }): Promise<Iterable<IndexEntry>>;
  getDocument(
    id: string,
  ): Promise<
    | { pages: { contents: { name: string; text?: { content?: string } }[] } }
    | undefined
  >;
  getDocuments(query?: object): Promise<unknown[]>;
};

type Packs = { get(id: string): Pack | undefined; contents: Pack[] };

export const packs = () => game.packs as unknown as Packs;

export const squash = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

export const tomeActive = () => !!game.modules?.get(TOME)?.active;

export const activeClassSet = (): ClassSet =>
  tomeActive() ? "advanced" : "classic";

export const enrich = (html: string) =>
  html
    ? foundry.applications.ux.TextEditor.enrichHTML(html, {
        documents: true,
        links: true,
        rolls: true,
      })
    : Promise.resolve("");

export async function journalPageHtml(
  packId: string,
  entryName: RegExp,
  name: string,
) {
  const pack = packs().get(packId);
  if (!pack) return undefined;
  const entries = [...(await pack.getIndex())].filter((e) =>
    entryName.test(e.name),
  );
  for (const entry of entries) {
    const doc = await pack.getDocument(entry._id);
    const page = doc?.pages.contents.find(
      (p) => squash(p.name) === squash(name),
    );
    if (page) return page.text?.content ?? "";
  }
  return undefined;
}
