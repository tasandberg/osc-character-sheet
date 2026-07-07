import { useEffect, useState, type ReactNode } from "react";
import { OscSheetContext } from "@app/context";
import type { OSEActor, OseItem, OscContext } from "@domain/types";
import type { ContextConnector } from "foundry-vtt-react";
import { TabIds } from "@app/tabs";

function OscSheetProvider({
  initialActor,
  children,
  source,
  contextConnector,
  canEdit,
}: {
  initialActor: OSEActor;
  source: OSEActor;
  children: ReactNode;
  contextConnector?: ContextConnector<OscContext>;
  canEdit: boolean;
}) {
  const [actor, setActor] = useState<OSEActor>(initialActor);
  const [actorData, setActorData] = useState(initialActor.system);
  const [items, setItems] = useState<OseItem[]>(
    initialActor.items.contents as OseItem[]
  );
  const [currentTab, setCurrentTab] = useState<TabIds>(TabIds.ACTIONS);

  const _setTimestampedActor = (updatedActor: OSEActor) => {
    updatedActor.updatedAt = new Date().toISOString();
    updatedActor.system.updatedAt = new Date().toISOString();
    setActor(updatedActor);
    setActorData(updatedActor.system);
  };

  async function updateActor(updateData: {
    [key: string]: string | number;
  }): Promise<OSEActor | void> {
    if (actor.update) {
      return await actor.update(updateData).then((updatedActor) => {
        if (updatedActor) {
          _setTimestampedActor(updatedActor);
        }
      });
    } else {
      throw new Error("Actor does not have an update method");
    }
  }

  useEffect(() => {
    const handleUpdate = foundry.utils.debounce(
      ({ document }: { document: OSEActor }) => {
        _setTimestampedActor(document);
        setItems([...(document.items.contents as OseItem[])]);
      },
      200
    );
    contextConnector.onUpdate(handleUpdate);

    return () => {
      contextConnector.tearDown(handleUpdate);
    };
  }, [contextConnector]);

  const context = {
    actor,
    actorData,
    source,
    items,
    currentTab,
    setCurrentTab,
    updateActor,
    canEdit,
  };

  return (
    <OscSheetContext.Provider value={context}>
      {children}
    </OscSheetContext.Provider>
  );
}

export default OscSheetProvider;
