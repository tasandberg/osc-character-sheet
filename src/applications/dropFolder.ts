export interface FolderEntry {
  uuid: string;
}

export interface DroppableFolder {
  contents: FolderEntry[];
  getSubfolders(recursive: boolean): { contents: FolderEntry[] }[];
}

export interface DroppableItem {
  inCompendium?: boolean;
  toObject(): ItemSource;
}

export interface ItemSource {
  _id?: string | null;
  type?: string;
  system?: Record<string, unknown>;
  [key: string]: unknown;
}

export type FromCompendium = (
  item: DroppableItem,
  options: { clearFolder: boolean; keepId: boolean },
) => ItemSource;

export function folderEntries(folder: DroppableFolder): FolderEntry[] {
  return [
    ...folder.contents,
    ...folder.getSubfolders(true).flatMap((subfolder) => subfolder.contents),
  ];
}

export function droppedItemData(
  items: DroppableItem[],
  fromCompendium: FromCompendium,
): ItemSource[] {
  return items.map((item) => {
    const source = item.inCompendium
      ? fromCompendium(item, { clearFolder: true, keepId: false })
      : item.toObject();
    const data: ItemSource = {
      ...source,
      system: { ...source.system, containerId: "" },
    };
    delete data._id;
    if (data.type === "container") data.system!.itemIds = [];
    return data;
  });
}
