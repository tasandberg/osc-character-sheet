// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import { addNewCharacterButton } from "./newCharacterButton";

const directory = () => {
  const root = document.createElement("section");
  root.innerHTML = `<div><button data-action="createEntry">Create Actor</button></div>`;
  return root;
};

const buttonNames = (root: HTMLElement) =>
  [...root.querySelectorAll("button")].map((button) => button.textContent);

describe("addNewCharacterButton", () => {
  it("adds one New Character button beside Create Actor across re-renders", () => {
    const root = directory();
    const onClick = vi.fn();
    addNewCharacterButton(root, { enabled: true, onClick });
    addNewCharacterButton(root, { enabled: true, onClick });

    expect(buttonNames(root)).toEqual(["Create Actor", "New Character"]);
    root.querySelectorAll("button")[1].click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("removes the button when the wizard is disabled", () => {
    const root = directory();
    addNewCharacterButton(root, { enabled: true, onClick: () => {} });
    addNewCharacterButton(root, { enabled: false, onClick: () => {} });

    expect(buttonNames(root)).toEqual(["Create Actor"]);
  });
});
