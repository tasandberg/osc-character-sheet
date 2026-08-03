import { OscSheetContext } from "@app/context";
import SpellsView from "@features/spells/SpellsView";
import { context } from "@src/OscSheet/stories/fixtures";

export default { title: "Tabs / Spells" };

const Tab = (ctx = context()) => (
  <OscSheetContext.Provider value={ctx}>
    <SpellsView />
  </OscSheetContext.Provider>
);

export const Default = () => Tab();

export const ReadOnly = () => Tab(context({ canEdit: false }));
