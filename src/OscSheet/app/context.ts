import { createContext, useContext } from "react";
import type { OscSheetContextValue } from "@domain/types";

export const OscSheetContext = createContext<OscSheetContextValue>(
  null!
);

export function useOscSheetContext() {
  const context = useContext(OscSheetContext);
  if (!context) {
    throw new Error(
      "useOscSheetContext must be used within a OscSheetProvider"
    );
  }
  return context;
}
