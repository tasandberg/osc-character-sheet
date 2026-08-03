import { OscSheetContext } from "@app/context";
import { ActionsView } from "@features/actions/ActionsView";
import { actor, context } from "@src/OscSheet/stories/fixtures";

// The whole Actions tab, not its sections in isolation. The 2026 conversion
// defect was invisible precisely because only the pieces had stories and the
// assembled tab had none.
export default { title: "Tabs / Actions" };

const Tab = (ctx = context()) => (
  <OscSheetContext.Provider value={ctx}>
    <ActionsView actor={actor} />
  </OscSheetContext.Provider>
);

export const Default = () => Tab();

// Observer/limited permission: the composite Attack button is gated on canEdit,
// the chat-only rolls are not.
export const ReadOnly = () => Tab(context({ canEdit: false }));
