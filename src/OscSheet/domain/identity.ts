import type { OSEActor } from "@domain/types";
import type { IdentityVM } from "@domain/vm-types";

export function selectIdentity(actor: OSEActor): IdentityVM {
  const { details, retainer } = actor.system;
  const classes = actor.system.classes ?? [];
  const classLevels =
    classes.length > 1
      ? classes.map((c) => `${c.name} ${c.system.level}`).join(" / ")
      : `${details.class} ${details.level}`;
  return {
    name: actor.name,
    img: actor.img,
    classLabel: details.class,
    classLevels,
    race: actor.system.race?.name,
    level: details.level,
    alignment: details.alignment,
    title: details.title,
    isRetainer: retainer?.enabled === true,
    wage: retainer?.wage ?? "",
  };
}
