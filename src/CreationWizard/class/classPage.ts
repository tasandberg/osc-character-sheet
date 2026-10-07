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

  const intro: string[] = [];
  for (
    let el = table.nextElementSibling;
    el && !/^H[1-6]$/.test(el.tagName);
    el = el.nextElementSibling
  )
    intro.push(el.outerHTML);

  return {
    description: intro.join(""),
    armour: stats.armour || undefined,
    weapons: stats.weapons || undefined,
  };
}
