import { useState } from "react";

export type OscSheetSettings = {
  currentPage: string;
};
export function useLocalSettings() {
  const [sheetSettings, setSheetSettings] = useState<OscSheetSettings>(
    () => {
      const saved = localStorage.getItem("oscSheetSettings");
      return saved ? JSON.parse(saved) : { currentPage: "tab1" };
    }
  );

  const updateSettings = (newSettings: OscSheetSettings) => {
    const updatedSettings = { ...sheetSettings, ...newSettings };
    setSheetSettings(updatedSettings);
    localStorage.setItem(
      "oscSheetSettings",
      JSON.stringify(updatedSettings)
    );
  };

  const setSetting = (key: keyof OscSheetSettings, value: string) => {
    const updatedSettings = { ...sheetSettings, [key]: value };
    setSheetSettings(updatedSettings);
    localStorage.setItem(
      "oscSheetSettings",
      JSON.stringify(updatedSettings)
    );
  };

  return { sheetSettings, setSetting, updateSettings } as const;
}
