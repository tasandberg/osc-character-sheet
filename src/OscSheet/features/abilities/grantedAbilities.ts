import { useEffect, useState } from "react";
import type {
  OSEActor,
  OseAbility,
  OseClassItem,
  OseRaceItem,
} from "@domain/types";

export type GrantingItem = OseClassItem | OseRaceItem;

export interface GrantLink {
  uuid: string;
  name: string | null;
  requirements: string;
}

export type GrantLinks = Record<string, GrantLink[]>;

interface Grant {
  type: string;
  key: string;
}

const same = (a: string, b: string) =>
  (a ?? "").toLocaleLowerCase().trim() === (b ?? "").toLocaleLowerCase().trim();

export const itemKey = (item: GrantingItem) => (item.id ?? item.name) as string;

const unresolvedLinks = (item: GrantingItem): GrantLink[] =>
  (item.system.abilities ?? []).map(({ uuid }) => ({
    uuid,
    name: null,
    requirements: "",
  }));

export function grantingItems(actor: OSEActor): GrantingItem[] {
  const classes = actor.system.classes ?? [];
  if (!classes.length) return [];
  const race = actor.system.race;
  return race ? [...classes, race] : classes;
}

function isGrantedBy(
  ability: OseAbility,
  item: GrantingItem,
  links: GrantLink[],
) {
  const flags = ability.flags as Record<
    string,
    { grantedBy?: Grant; sourceId?: string } | undefined
  >;
  const grantedBy = flags?.[game.system.id]?.grantedBy;
  if (grantedBy)
    return grantedBy.type === item.type && grantedBy.key === item.system.key;
  const stats = (ability as { _stats?: { compendiumSource?: string | null } })
    ._stats;
  const source = stats?.compendiumSource ?? flags?.core?.sourceId ?? "";
  const requirements = ability.system.requirements ?? "";
  return links.some(
    (l) =>
      (source && source === l.uuid) ||
      (l.name !== null &&
        same(ability.name, l.name) &&
        same(requirements, l.requirements)),
  );
}

export function groupAbilities(
  actor: OSEActor,
  links: GrantLinks,
): { byItem: Record<string, string[]>; ungranted: string[] } {
  const items = grantingItems(actor);
  const byItem: Record<string, string[]> = Object.fromEntries(
    items.map((i) => [itemKey(i), []]),
  );
  const ungranted: string[] = [];
  for (const ability of Object.values(
    actor.system.abilities ?? {},
  ) as OseAbility[]) {
    const owner = items.find((item) =>
      isGrantedBy(ability, item, links[itemKey(item)] ?? unresolvedLinks(item)),
    );
    (owner ? byItem[itemKey(owner)] : ungranted).push(ability._id as string);
  }
  return { byItem, ungranted };
}

async function resolveLinks(uuids: string[]): Promise<GrantLink[]> {
  const links: GrantLink[] = [];
  for (const uuid of uuids) {
    const doc = (await fromUuid(uuid)) as {
      name: string;
      system?: { requirements?: string };
    } | null;
    if (doc)
      links.push({
        uuid,
        name: doc.name,
        requirements: doc.system?.requirements ?? "",
      });
  }
  return links;
}

export function useGrantLinks(actor: OSEActor): GrantLinks {
  const signature = JSON.stringify(
    grantingItems(actor).map((i) => [
      itemKey(i),
      (i.system.abilities ?? []).map((a) => a.uuid),
    ]),
  );
  const [links, setLinks] = useState<GrantLinks>({});
  useEffect(() => {
    let cancelled = false;
    const wanted = JSON.parse(signature) as [string, string[]][];
    void Promise.all(
      wanted.map(
        async ([key, uuids]) => [key, await resolveLinks(uuids)] as const,
      ),
    ).then((entries) => {
      if (!cancelled) setLinks(Object.fromEntries(entries));
    });
    return () => {
      cancelled = true;
    };
  }, [signature]);
  return links;
}
