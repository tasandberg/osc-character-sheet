import { useState } from "react";
import type { ReactNode } from "react";
import {
  Modal,
  Button,
  SectionTitle,
  ConfirmDialog,
  OverrideValue,
  StampCell,
  PortraitField,
  NumberInput,
  ValidatedInput,
  Combobox,
  Tag,
  Check,
} from "@src/OscSheet/components/ui";
import { useOscSheetContext } from "@app/context";
import {
  selectClassDefaults,
  availableClassNames,
  classSource,
} from "@domain/classRules";
import { usesAscendingAC } from "@domain/chat/targeting";
import type { OSESave } from "@domain/types";
import { HitDiceField } from "./HitDiceField";
import { ExplorationSection } from "./ExplorationSection";
import {
  ED_FIELD,
  ED_HINT,
  LAB_ID,
  SPAN_2,
  SPAN_3,
  SPAN_4,
  SPAN_COMBO,
} from "./classes";

const SOURCE_TAG = {
  advanced: ["ADV", "teal", "Advanced Fantasy"],
  classic: ["SRD", "brass", "Classic Fantasy SRD"],
  custom: ["CUS", "mustard", "Custom"],
} as const;

// One face for both dropdown rows and the at-rest chip, so they stay identical.
function classFace(name: string): ReactNode {
  const [text, intent, title] = SOURCE_TAG[classSource(name)];
  return (
    <>
      <span className="combobox-optlabel">{name.replace(/-/g, " ")}</span>
      <Tag intent={intent} size="xs" title={title}>
        {text}
      </Tag>
    </>
  );
}

const fmtMod = (n: number) => (n >= 0 ? "+" : "") + n;
const clamp = (n: number, lo: number, hi: number) =>
  Math.max(lo, Math.min(hi, n));

// Mirrors the sheet's plaque order (features/actions/abilities.ts) — editing scores in a
// different order than they're displayed invites typing a value into the wrong field.
const ABIL_ORDER = ["str", "int", "wis", "dex", "con", "cha"] as const;
const ALIGNMENTS = ["Lawful", "Neutral", "Chaotic"];
const SAVE_DEFS: { k: OSESave; n: string }[] = [
  { k: "death", n: "Death / Poison" },
  { k: "wand", n: "Magic Wands" },
  { k: "paralysis", n: "Paralysis / Petrify" },
  { k: "breath", n: "Breath Attacks" },
  { k: "spell", n: "Spells / Rods / Staves" },
];
type ConfirmState = { title: string; body: string; fn: () => void } | null;

export function EditModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { actor, updateActor } = useOscSheetContext();
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const requestConfirm = (title: string, body: string, fn: () => void) =>
    setConfirm({ title, body, fn });

  if (!open) return null;

  const sys = actor.system;
  const defaults = selectClassDefaults(actor);
  const set = (key: string, value: string | number | boolean) =>
    void updateActor({ [key]: value });

  // --- Identity / progression ---
  // GMs can re-class a character; players see the class as static header text.
  const isGM = game.user?.isGM ?? false;
  const classNames = availableClassNames();
  const level = sys.details.level;
  const dexInit = sys.scores.dex.init;
  const initMod = sys.initiative?.mod ?? 0;
  const initEff = dexInit + initMod;
  const nextXp = defaults.nextXp;

  // --- Hit Dice (freeform formula string, e.g. "4d8+1") ---
  const hdVal = sys.hp.hd || defaults.hd || `${level}d8`;
  const hdDefault = defaults.hd;
  const hdOverridden = !!hdDefault && hdVal !== hdDefault;

  // --- Attack (THAC0 descending / Attack Bonus ascending) ---
  const ascendingAC = usesAscendingAC();
  const atkLabel = ascendingAC ? "Attack Bonus" : "THAC0";
  const atkKey = ascendingAC ? "system.thac0.bba" : "system.thac0.value";
  const atkVal = ascendingAC ? sys.thac0.bba : sys.thac0.value;
  const atkDefault =
    defaults.thac0 == null
      ? null
      : ascendingAC
        ? 19 - defaults.thac0
        : defaults.thac0;
  const atkOverridden = atkDefault != null && atkVal !== atkDefault;

  // --- Movement ---
  // Mirror OSE's own sheet: show system.movement.base (the derived getter —
  // encumbrance-scaled when auto, raw when manual), disabled while auto-calculate is
  // on. The checkbox only toggles the flag. Floored so a breakpoint fraction doesn't
  // render as e.g. 82.5; editing (auto off) writes the raw base.
  const movementAuto = sys.config?.movementAuto ?? true;
  const rawMoveBase = actor._source?.system?.movement?.base ?? 120;
  const moveShown = Math.floor(sys.movement?.base ?? rawMoveBase);

  const footer = (
    <Button variant="primary" onClick={onClose}>
      Close
    </Button>
  );

  return (
    <Modal
      open={open}
      title="Edit Character"
      onClose={onClose}
      footer={footer}
      className="modal-inset fe-modal"
    >
      <div className="fe-modal-body tw:flex tw:flex-col tw:gap-5">
        {/* Identity */}
        <div className="ed-sec tw:flex tw:flex-col tw:gap-3">
          <SectionTitle>
            Identity &amp; Vitals:{" "}
            {/* real serif italic — the display face is small-caps with no true
                italic — slightly dimmed as an annotation */}
            <em className="ed-id-class tw:font-serif tw:italic tw:text-text-dim">
              {sys.details.class.replace(/-/g, " ")}
            </em>
          </SectionTitle>
          <div className="ed-id-grid tw:flex-auto tw:min-w-0 tw:grid tw:grid-cols-12 tw:gap-[14px] tw:content-start">
            <PortraitField
              className="tw:col-start-1 tw:col-span-3 tw:row-start-1 tw:row-span-2 tw:@max-[560px]/fwin:row-span-1"
              src={actor.img}
              onPick={(path) => set("img", path)}
            />
            <label className={`${ED_FIELD} ${SPAN_3}`}>
              <span className={LAB_ID}>Name</span>
              <ValidatedInput
                className="input"
                value={actor.name}
                validate={(v) => (v ? null : "name can’t be empty")}
                onCommit={(v) => set("name", v)}
              />
            </label>
            <label className={`${ED_FIELD} ${SPAN_COMBO}`}>
              <span className={LAB_ID}>
                Class <span className={ED_HINT}>GM</span>
              </span>
              <Combobox
                disabled={!isGM}
                value={sys.details.class}
                options={(classNames ?? []).map((c) => ({
                  value: c,
                  label: c.replace(/-/g, " "),
                  node: classFace(c),
                }))}
                onCommit={(v) => set("system.details.class", v)}
                renderValue={classFace}
                createHint="Type to set a custom class"
                newOptionLabel={(q) => `Custom: “${q}”`}
              />
            </label>
            <label className={`${ED_FIELD} ${SPAN_2}`}>
              <span className={LAB_ID}>Level</span>
              <NumberInput
                className="input mono"
                value={level}
                min={1}
                onCommit={(n) => set("system.details.level", n)}
              />
            </label>
            <label className={`${ED_FIELD} ${SPAN_3}`}>
              <span className={LAB_ID}>Title</span>
              <ValidatedInput
                className="input"
                value={sys.details.title}
                validate={() => null}
                onCommit={(v) => set("system.details.title", v)}
              />
            </label>
            <label className={`${ED_FIELD} ${SPAN_COMBO}`}>
              <span className={LAB_ID}>Alignment</span>
              <Combobox
                value={sys.details.alignment}
                options={ALIGNMENTS.map((a) => ({ value: a, label: a }))}
                onCommit={(v) => set("system.details.alignment", v)}
                createHint="Type to set a custom alignment"
                newOptionLabel={(q) => `Custom: “${q}”`}
              />
            </label>

            <HitDiceField
              className={SPAN_2}
              actor={actor}
              hdVal={hdVal}
              hdDefault={hdDefault}
              hdOverridden={hdOverridden}
              onCommit={(v) => set("system.hp.hd", v)}
              onResetRequest={() =>
                requestConfirm(
                  "Reset Hit Dice?",
                  `Revert to the class default of ${hdDefault}.`,
                  () => set("system.hp.hd", hdDefault!),
                )
              }
            />
            <label className={`${ED_FIELD} ${SPAN_3}`}>
              <span className={LAB_ID}>Current XP</span>
              <NumberInput
                className="input mono"
                value={sys.details.xp.value}
                min={0}
                onCommit={(n) => set("system.details.xp.value", n)}
              />
            </label>
            <label className={`${ED_FIELD} ${SPAN_3}`}>
              <span className={LAB_ID}>Next Level</span>
              <NumberInput
                className="input mono"
                value={sys.details.xp.next}
                min={0}
                onCommit={(n) => set("system.details.xp.next", n)}
              />
              {nextXp != null && (
                <OverrideValue
                  overridden={sys.details.xp.next !== nextXp}
                  defaultText={`default · ${nextXp.toLocaleString()}`}
                  onResetRequest={() =>
                    requestConfirm(
                      "Reset Next Level?",
                      `Revert to the class default of ${nextXp.toLocaleString()} XP.`,
                      () => set("system.details.xp.next", nextXp),
                    )
                  }
                />
              )}
            </label>
            <label className={`${ED_FIELD} ${SPAN_3}`}>
              <span className={LAB_ID}>Current HP</span>
              <NumberInput
                className="input mono"
                value={sys.hp.value}
                min={0}
                max={sys.hp.max}
                onCommit={(n) => set("system.hp.value", n)}
              />
            </label>
            <label className={`${ED_FIELD} ${SPAN_2}`}>
              <span className={LAB_ID}>Max HP</span>
              <NumberInput
                className="input mono"
                value={sys.hp.max}
                min={1}
                onCommit={(n) => set("system.hp.max", n)}
              />
            </label>

            <div className={`${ED_FIELD} ${SPAN_3}`}>
              <span className={LAB_ID}>Initiative Mod</span>
              <NumberInput
                className="input mono"
                value={initEff}
                onCommit={(n) => set("system.initiative.mod", n - dexInit)}
              />
              <OverrideValue
                overridden={initMod !== 0}
                defaultText={`DEX ${fmtMod(dexInit)}`}
                onResetRequest={() =>
                  requestConfirm(
                    "Reset Initiative?",
                    `Revert to the rule default of DEX ${fmtMod(dexInit)}.`,
                    () => set("system.initiative.mod", 0),
                  )
                }
              />
            </div>

            <div className={`${ED_FIELD} ${SPAN_3}`}>
              <span className={LAB_ID}>{atkLabel}</span>
              <NumberInput
                className="input mono"
                value={atkVal}
                onCommit={(n) => set(atkKey, n)}
              />
              {atkDefault != null && (
                <OverrideValue
                  overridden={atkOverridden}
                  defaultText={`default · ${atkDefault}`}
                  onResetRequest={() =>
                    requestConfirm(
                      `Reset ${atkLabel}?`,
                      `Revert to the class default of ${atkDefault}.`,
                      () => set(atkKey, atkDefault),
                    )
                  }
                />
              )}
            </div>

            <div className={`${ED_FIELD} ${SPAN_4}`}>
              <span className={LAB_ID}>Base Movement</span>
              <NumberInput
                className="input mono"
                value={moveShown}
                min={0}
                disabled={movementAuto}
                onCommit={(n) => set("system.movement.base", n)}
              />
              <Check
                className="ed-movecalc"
                checked={movementAuto}
                onChange={(e) =>
                  set("system.config.movementAuto", e.target.checked)
                }
              >
                Auto-calculate movement
              </Check>
            </div>
          </div>
        </div>

        {/* Ability Scores */}
        <div className="ed-sec tw:flex tw:flex-col tw:gap-3">
          <SectionTitle hint="raw scores">Ability Scores</SectionTitle>
          <div className="ed-cells ed-abil tw:grid tw:gap-2 tw:grid-cols-6 tw:@max-[520px]/fwin:grid-cols-3">
            {ABIL_ORDER.map((k) => {
              const req = defaults.requirements[k];
              const below = req != null && sys.scores[k].value < req;
              return (
                <StampCell
                  key={k}
                  stampKey={k.toUpperCase()}
                  value={sys.scores[k].value}
                  onChange={(n) =>
                    set(`system.scores.${k}.value`, clamp(n, 1, 20))
                  }
                  min={1}
                  max={20}
                  warn={below}
                  warnTitle={
                    below
                      ? `${sys.details.class} requires ${k.toUpperCase()} ${req}+`
                      : undefined
                  }
                  caption={
                    below ? `needs ${req}+` : `mod ${fmtMod(sys.scores[k].mod)}`
                  }
                />
              );
            })}
          </div>
        </div>

        {/* Saving Throws */}
        <div className="ed-sec tw:flex tw:flex-col tw:gap-3">
          <SectionTitle hint="roll ≥ target · default shown">
            Saving Throws
          </SectionTitle>
          <div className="ed-cells ed-save tw:grid tw:gap-2 tw:grid-cols-5">
            {SAVE_DEFS.map(({ k, n }) => {
              const def = defaults.saves?.[k] ?? null;
              const value = sys.saves[k].value;
              const overridden = def != null && value !== def;
              return (
                <StampCell
                  key={k}
                  stampKey={k.slice(0, 1).toUpperCase()}
                  fullName={n}
                  value={value}
                  onChange={(v) => set(`system.saves.${k}.value`, v)}
                  min={1}
                  max={20}
                  caption={def != null ? `default ${def}` : ""}
                  overridden={overridden}
                  onResetRequest={
                    def != null
                      ? () =>
                          requestConfirm(
                            `Reset ${n}?`,
                            `Revert to the rule default of ${def}.`,
                            () => set(`system.saves.${k}.value`, def),
                          )
                      : undefined
                  }
                />
              );
            })}
          </div>
        </div>

        <ExplorationSection />
      </div>

      <ConfirmDialog
        open={confirm != null}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        confirmLabel="Reset"
        variant="primary"
        onConfirm={() => {
          confirm?.fn();
          setConfirm(null);
        }}
        onCancel={() => setConfirm(null)}
      />
    </Modal>
  );
}
