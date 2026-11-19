import type { ClassStats } from "../rules";
import { formatModifier } from "../scores/scoreFace";

export const attackRow = (
  stats: Pick<ClassStats, "thac0" | "bba">,
  ascendingAC: boolean,
): [string, string] =>
  ascendingAC
    ? ["Attack Bonus", formatModifier(stats.bba)]
    : ["THAC0", `${stats.thac0} [${formatModifier(stats.bba)}]`];
