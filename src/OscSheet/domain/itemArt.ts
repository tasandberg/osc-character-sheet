import {
  ITEM_ICONS,
  resolveIconName,
  type OscIconName,
} from "@old-school-chronicle/vellum/icons";

const CORE_IMAGE_ICONS: Readonly<Record<string, OscIconName>> = {
  "icons/commodities/currency/coins-assorted-mix-copper.webp": "coins",
  "icons/commodities/currency/coins-assorted-mix-copper-silver-gold.webp":
    "coins",
  "icons/commodities/currency/coins-assorted-mix-platinum.webp": "coins",
  "icons/commodities/currency/coins-assorted-mix-silver.webp": "coins",
  "icons/commodities/flowers/lily-bloom-purple.webp": "wolfsbane",
  "icons/commodities/leather/leather-studded-tan.webp": "leather-armor",
  "icons/commodities/metal/mail-chain-steel.webp": "mail-shirt",
  "icons/commodities/metal/mail-plate-steel.webp": "plate-mail",
  "icons/commodities/treasure/token-cross-gem-yellow.webp": "holy-symbol",
  "icons/commodities/wood/fence-posts-brown.webp": "stakes-mallet",
  "icons/commodities/wood/wood-pole.webp": "pole",
  "icons/consumables/drinks/wine-amphora-clay-gray.webp": "holy-water",
  "icons/consumables/potions/potion-tube-corked-orange.webp": "potion",
  "icons/consumables/vegetable/garlic-white.webp": "garlic",
  "icons/containers/bags/coinpouch-simple-leather-brown.webp": "sack",
  "icons/containers/bags/coinpouch-simple-leather-silver-brown.webp": "sack",
  "icons/containers/bags/coinpouch-simple-tan.webp": "sack",
  "icons/containers/bags/pack-canvas-white-brown.webp": "backpack",
  "icons/containers/bags/sack-cloth-brown.webp": "sack",
  "icons/environment/creatures/fish-crosshatched-silver-blue.webp": "rations",
  "icons/equipment/chest/breastplate-banded-simple-leather-brown.webp":
    "leather-armor",
  "icons/equipment/chest/breastplate-cuirass-steel-grey.webp": "plate-mail",
  "icons/equipment/chest/breastplate-layered-steel.webp": "plate-mail",
  "icons/equipment/finger/ring-band-engraved-scrolls-gold.webp": "ring",
  "icons/equipment/head/helm-basinet-shemagh-steel.webp": "helmet",
  "icons/equipment/head/helm-norman-black-gilded.webp": "helmet",
  "icons/equipment/head/helm-norman-shrouded.webp": "helmet",
  "icons/equipment/head/helm-spangen-horned-gold.webp": "helmet",
  "icons/equipment/neck/amulet-engraved-wood.webp": "amulet",
  "icons/equipment/neck/amulet-round-brown.webp": "amulet",
  "icons/equipment/neck/amulet-round-engraved-gold.webp": "amulet",
  "icons/equipment/neck/necklace-carved-lantern-gold.webp": "amulet",
  "icons/equipment/shield/heater-wooden-brown-axe.webp": "shield",
  "icons/equipment/shield/round-wooden-boss-steel-red.webp": "shield",
  "icons/sundries/lights/lantern-iron-yellow.webp": "lantern",
  "icons/sundries/lights/torch-black.webp": "torch",
  "icons/sundries/scrolls/scroll-plain-red.webp": "scroll",
  "icons/sundries/survival/mirror-plain.webp": "mirror",
  "icons/sundries/survival/rope-coiled-brown.webp": "rope",
  "icons/sundries/survival/rope-wrapped-brown.webp": "rope",
  "icons/sundries/survival/waterskin-leather-brown.webp": "waterskin",
  "icons/sundries/survival/wetskin-leather-purple.webp": "wine",
  "icons/sundries/survival/wetskin-leather-red.webp": "oil-flask",
  "icons/tools/cooking/can.webp": "rations",
  "icons/tools/fasteners/pin-spiked.webp": "iron-spikes",
  "icons/tools/fishing/hook-multi-steel-brown.webp": "grappling-hook",
  "icons/tools/hand/hammer-cobbler-steel.webp": "hammer",
  "icons/tools/hand/hatchet-steel-grey.webp": "hand-axe",
  "icons/tools/hand/lockpicks-steel-grey.webp": "thieves-tools",
  "icons/weapons/ammunition/arrow-head-war-flight.webp": "arrow",
  "icons/weapons/ammunition/arrow-head-war.webp": "arrow",
  "icons/weapons/ammunition/arrows-barbed-white.webp": "arrow",
  "icons/weapons/ammunition/arrows-bodkin-yellow-red.webp": "arrow",
  "icons/weapons/ammunition/arrows-war-white.webp": "arrow",
  "icons/weapons/ammunition/shot-round-brown.webp": "sling-stones",
  "icons/weapons/axes/axe-battle-blackened.webp": "battle-axe",
  "icons/weapons/bows/longbow-leather-green.webp": "long-bow",
  "icons/weapons/bows/longbow-recurve-leather-brown.webp": "long-bow",
  "icons/weapons/bows/shortbow-leather.webp": "short-bow",
  "icons/weapons/bows/shortbow-recurve-blue.webp": "short-bow",
  "icons/weapons/clubs/club-simple-black.webp": "club",
  "icons/weapons/crossbows/crossbow-purple.webp": "crossbow",
  "icons/weapons/daggers/dagger-double-engraved-black.webp": "dagger",
  "icons/weapons/daggers/dagger-jeweled-purple.webp": "dagger",
  "icons/weapons/daggers/dagger-straight-blue.webp": "dagger",
  "icons/weapons/daggers/dagger-straight-cracked.webp": "dagger",
  "icons/weapons/hammers/hammer-double-engraved-ruby.webp": "war-hammer",
  "icons/weapons/hammers/hammer-war-rounding.webp": "war-hammer",
  "icons/weapons/maces/mace-flanged-steel-grey.webp": "mace",
  "icons/weapons/maces/mace-round-steel.webp": "mace",
  "icons/weapons/polearms/halberd-engraved-black.webp": "pole-arm",
  "icons/weapons/polearms/javelin-simple.webp": "javelin",
  "icons/weapons/polearms/spear-flared-blue.webp": "spear",
  "icons/weapons/polearms/spear-flared-green.webp": "spear",
  "icons/weapons/polearms/spear-flared-steel.webp": "spear",
  "icons/weapons/slings/slingshot-wood.webp": "sling",
  "icons/weapons/staves/staff-engraved-wood.webp": "staff",
  "icons/weapons/staves/staff-ornate-purple.webp": "staff",
  "icons/weapons/staves/staff-simple-spiral-grey.webp": "staff",
  "icons/weapons/swords/greatsword-crossguard-flanged-red.webp": "sword",
  "icons/weapons/swords/greatsword-crossguard-steel.webp": "two-handed-sword",
  "icons/weapons/swords/shortsword-guard-brass.webp": "short-sword",
  "icons/weapons/swords/sword-guard-brass-worn.webp": "sword",
  "icons/weapons/thrown/bomb-fuse-red-black.webp": "fire-bottle",
  "icons/weapons/wands/wand-gem-purple.webp": "wand",
};

const OSE_DEFAULT_IMAGE = /^\/?systems\/ose\/assets\/default\//;
const NAMED_TYPES = new Set(["weapon", "armor", "item", "container"]);

export type ArtSource = {
  type?: string;
  name?: string | null;
  img?: string | null;
  _stats?: { compendiumSource?: string | null } | null;
};

export type ItemArt = { icon: OscIconName | null; img: string };

function fromImage(img: string): OscIconName | undefined {
  return CORE_IMAGE_ICONS[img.replace(/^\//, "")];
}

function fromSourceId(item: ArtSource): OscIconName | undefined {
  const key = ITEM_ICONS[item._stats?.compendiumSource ?? ""];
  return key ? resolveIconName(key) : undefined;
}

function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/^\[[^\]]*\]\s*/, "")
    .replace(/[(+,].*$/, "")
    .replace(/'/g, "")
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fromName(name: string): OscIconName | undefined {
  const s = slug(name);
  if (!s) return undefined;
  const catalogued = ITEM_ICONS[`ose.${s}`];
  if (catalogued) return resolveIconName(catalogued);
  return (
    resolveIconName(s) ??
    resolveIconName(s.replace(/s$/, "")) ??
    resolveIconName(s.replace(/es$/, ""))
  );
}

export function itemArt(item: ArtSource): ItemArt {
  const img = item.img ?? "";
  const icon =
    (img ? fromImage(img) : undefined) ??
    fromSourceId(item) ??
    (item.name && NAMED_TYPES.has(item.type ?? "")
      ? fromName(item.name)
      : undefined);
  if (icon) return { icon, img: "" };
  return { icon: null, img: OSE_DEFAULT_IMAGE.test(img) ? "" : img };
}
