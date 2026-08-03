import { OscSheetContext } from "@app/context";
import NotesView from "@features/notes/NotesView";
import { context } from "@src/OscSheet/stories/fixtures";

export default { title: "Tabs / Notes" };

const Tab = (ctx = context()) => (
  <OscSheetContext.Provider value={ctx}>
    <NotesView />
  </OscSheetContext.Provider>
);

export const Default = () => Tab();

export const ReadOnly = () => Tab(context({ canEdit: false }));
