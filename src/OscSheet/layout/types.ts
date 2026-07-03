import type { ReactNode } from "react";

/** Presentational tab descriptor — no Foundry/actor coupling. */
export type TabItem = {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
};
