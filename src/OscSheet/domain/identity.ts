import type { OSEActor } from "@domain/types";
import type { IdentityVM } from "@domain/vm-types";

export function selectIdentity(actor: OSEActor): IdentityVM {
  const { details, retainer } = actor.system;
  const classes = (actor.system.classes ?? []).map((c) => ({
    id: c.id ?? c._id,
    label: `${c.name} ${c.system.level}`,
  }));
  const classLevels =
    classes.length > 1
      ? classes.map((c) => c.label).join(" / ")
      : `${details.class} ${details.level}`;
  return {
    name: actor.name,
    img: actor.img,
    classLabel: details.class,
    classLevels,
    classes,
    race: actor.system.race?.name,
    raceId: actor.system.race?.id ?? actor.system.race?._id,
    level: details.level,
    alignment: details.alignment,
    title: details.title,
    isRetainer: retainer?.enabled === true,
    wage: retainer?.wage ?? "",
  };
}
