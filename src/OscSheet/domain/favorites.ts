import type { OseItem } from "@domain/types";
import { FLAGS, readFlag, setFlag, unsetFlag } from "@domain/flags";

/** Whether an item is favorited (shown on the Actions tab). */
export function isFavorite(item: OseItem): boolean {
  return !!readFlag<boolean>(item, FLAGS.favorite);
}

/** Toggle an item's favorite flag. */
export function toggleFavorite(item: OseItem): Promise<unknown> {
  return isFavorite(item) ? unsetFlag(item, FLAGS.favorite) : setFlag(item, FLAGS.favorite, true);
}
