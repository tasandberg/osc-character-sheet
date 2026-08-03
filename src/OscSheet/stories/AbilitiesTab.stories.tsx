import { OscSheetContext } from "@app/context";
import AbilitiesView from "@features/abilities/AbilitiesView";
import { context } from "@src/OscSheet/stories/fixtures";

export default { title: "Tabs / Abilities" };

const Tab = (ctx = context()) => (
  <OscSheetContext.Provider value={ctx}>
    <AbilitiesView />
  </OscSheetContext.Provider>
);

export const Default = () => Tab();

export const ReadOnly = () => Tab(context({ canEdit: false }));
