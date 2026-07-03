import { AttacksTable } from "@features/actions/AttacksTable";
import type { AttackVM, AttackMode } from "@domain/vm-types";

export default { title: "Actions / AttacksTable" };

// strip the " +N(abil)" display suffix to get a rollable formula (keeps the die)
const toFormula = (label: string) => label.replace(/\s*\(.*\)$/, "").replace(/\s+/g, "");
const mode = (name: string, kind: "melee" | "missile", hit: string, dmg: string): AttackMode => ({
  kind,
  kindLabel: kind === "melee" ? "Melee" : "Missile",
  hit: { label: hit, formula: toFormula(hit), flavor: `${name} attack` },
  hitDisplay: hit,
  hitTip: hit,
  dmg: { label: dmg, formula: toFormula(dmg), flavor: `${name} damage` },
  dmgDisplay: dmg,
  dmgTip: dmg,
});
const W = (id: string, name: string, modes: AttackMode[], q: { label: string; icon: string }[]): AttackVM => ({
  id,
  itemId: id,
  name,
  img: "",
  modes,
  qualities: q,
});

export const Default = () => (
  <AttacksTable
    onRoll={(s) => console.log("roll", s)}
    onAttack={(id) => console.log("attack", id)}
    attacks={[
      // melee+missile: tags toggle the active mode (melee default)
      W(
        "dagger",
        "Dagger",
        [mode("Dagger", "melee", "1d20", "1d4"), mode("Dagger", "missile", "1d20 +1(dex)", "1d4")],
        [{ label: "Thrown", icon: "fa-bullseye-pointer" }],
      ),
      // single-mode melee
      W("staff", "Quarterstaff", [mode("Quarterstaff", "melee", "1d20 +2(str)", "1d6 +2(str)")], [
        { label: "Two-handed", icon: "fa-hand-fist" },
        { label: "Slow", icon: "fa-hourglass" },
      ]),
    ]}
  />
);
