import type { OSEActor } from "@domain/types";

type Opener = (actor?: OSEActor) => void;

let opener: Opener = () => {};

export function setCreationWizardOpener(next: Opener): void {
  opener = next;
}

export function openCreationWizard(actor?: OSEActor): void {
  opener(actor);
}
