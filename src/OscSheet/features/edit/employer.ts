export interface EmployerCandidate {
  id: string | null;
  name: string | null;
  img?: string | null;
  type: string;
  hasPlayerOwner: boolean;
  system?: { scores?: { cha?: { value?: number; loyalty?: number } } };
}

export interface EmployerOption {
  id: string;
  name: string;
  img: string | null;
}

export interface LoyaltyDefault {
  loyalty: number;
  cha: number;
  employerName: string;
}

export function selectEmployerOptions(
  actors: Iterable<EmployerCandidate>,
  selfId: string | null | undefined,
): EmployerOption[] {
  const options: EmployerOption[] = [];
  for (const a of actors) {
    if (!a.id || a.id === selfId) continue;
    if (a.type !== "character" || !a.hasPlayerOwner) continue;
    options.push({ id: a.id, name: a.name ?? "", img: a.img ?? null });
  }
  return options.sort((x, y) => x.name.localeCompare(y.name));
}

export function employerLoyaltyDefault(
  employer: EmployerCandidate | null | undefined,
): LoyaltyDefault | null {
  const cha = employer?.system?.scores?.cha;
  if (typeof cha?.loyalty !== "number" || typeof cha.value !== "number") {
    return null;
  }
  return {
    loyalty: cha.loyalty,
    cha: cha.value,
    employerName: employer?.name ?? "",
  };
}

export function worldActors(): EmployerCandidate[] {
  const actors = (
    globalThis as { game?: { actors?: Iterable<EmployerCandidate> } }
  ).game?.actors;
  return actors ? Array.from(actors) : [];
}
