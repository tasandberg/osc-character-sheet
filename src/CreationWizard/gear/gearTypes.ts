import type { AbilityScores } from "../scores/scoresDraft";

export type GearCategory = "weapons" | "armour" | "gear" | "ammunition";

export interface GearItem {
  uuid: string;
  name: string;
  img: string;
  category: GearCategory;
  cost: number;
  weight: number;
  detail?: string;
}

export interface CartLine {
  uuid: string;
  quantity: number;
}

export interface LoadPreview {
  armourClass: number;
  enabled: boolean;
  value: number;
  max: number;
  pct: number;
  label: string;
  tier: string | null;
  movement: { base: number; encounter: number; overland: number };
}

export type LoadGearCatalog = () => Promise<GearItem[]>;

export type PreviewLoad = (
  cart: CartLine[],
  catalog: GearItem[],
  scores: AbilityScores,
) => Promise<LoadPreview>;
