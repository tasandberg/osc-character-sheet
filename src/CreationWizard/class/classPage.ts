export type ClassPage = {
  description: string;
  armour?: string;
  weapons?: string;
};

const clean = (text: string) =>
  text
    .replace(/\[\[\/r\s*([^\]]+)\]\]/g, "$1")
    .replace(/^\s*:\s*/, "")
    .replace(/\s+/g, " ")
    .trim();

function statValue(label: Element) {
  const cell = label.closest("td");
  const next = cell?.nextElementSibling;
  if (next && cell?.textContent?.trim() === label.textContent?.trim())
    return next.textContent ?? "";
  let value = "";
  for (
    let node = label.nextSibling;
    node && node.nodeName !== "BR" && node.nodeName !== "STRONG";
    node = node.nextSibling
  )
    value += node.textContent ?? "";
  return value;
}

export function parseClassPage(html: string): ClassPage {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const table = doc.body.querySelector("table");
  if (!table) return { description: "" };

  const stats: Record<string, string> = {};
  for (const label of table.querySelectorAll("strong")) {
    const key = clean(label.textContent ?? "").replace(/:$/, "");
    stats[key.toLowerCase()] = clean(statValue(label));
  }

  let intro = table.nextElementSibling;
  while (intro && intro.tagName !== "P") intro = intro.nextElementSibling;

  return {
    description: intro?.outerHTML ?? "",
    armour: stats.armour || undefined,
    weapons: stats.weapons || undefined,
  };
}
