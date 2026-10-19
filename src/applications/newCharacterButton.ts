const BUTTON_CLASS = "osc-new-character";

export function addNewCharacterButton(
  root: HTMLElement,
  { enabled, onClick }: { enabled: boolean; onClick: () => void },
): void {
  root.querySelector(`.${BUTTON_CLASS}`)?.remove();
  const create = root.querySelector('[data-action="createEntry"]');
  if (!enabled || !create) return;

  const button = document.createElement("button");
  button.type = "button";
  button.className = BUTTON_CLASS;
  button.innerHTML = `<i class="fa-solid fa-hat-wizard" aria-hidden="true"></i><span>New Character</span>`;
  button.addEventListener("click", onClick);
  create.after(button);
}
