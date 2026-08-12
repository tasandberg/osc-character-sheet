import type { OSEActor } from "@domain/types";
import type { IdentityVM } from "@domain/vm-types";

export function selectIdentity(actor: OSEActor): IdentityVM {
  const { details } = actor.system;
  return {
    name: actor.name,
    img: actor.img,
    classLabel: details.class,
    level: details.level,
    alignment: details.alignment,
    title: details.title,
  };
}
