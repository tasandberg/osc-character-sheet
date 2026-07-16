import { useState } from "react";
import {
  Modal, Button, SectionTitle, ConfirmDialog, OverrideValue,
  StampCell, InlineButton, PortraitField, NumberInput, ValidatedInput,
} from "@src/OscSheet/components/ui";
import { useOscSheetContext } from "@app/context";
import { selectClassDefaults, availableClassNames } from "@domain/classRules";
import type { OSEActor, OSESave } from "@domain/types";

// A hit-die formula must be a valid Roll AND actually contain a die term.
const validateHd = (v: string) =>
  /d\d/i.test(v) && Roll.validate(v) ? null : "invalid dice formula";

// Freeform hit-dice formula field: validates the roll string on blur (via
// ValidatedInput), committing only when valid; the roll button uses the
// last committed value.
function HitDiceField({
  actor, hdVal, hdDefault, hdOverridden, onCommit, onResetRequest,
}: {
  actor: OSEActor;
  hdVal: string;
  hdDefault: string | null | undefined;
  hdOverridden: boolean;
  onCommit: (v: string) => void;
  onResetRequest: () => void;
}) {
  const rollHd = () => {
    const speaker = ChatMessage.getSpeaker({ actor });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    void new Roll(hdVal).toMessage({ speaker, flavor: `Hit Dice — ${hdVal}` } as any);
  };

  return (
    <div className="ed-field" style={{ gridColumn: "7 / span 3" }}>
      <span className="lab">Hit Dice</span>
      <InlineButton className="ed-rollbtn" title={`Roll ${hdVal} hit points`} onClick={rollHd}>
        <i className="fa-solid fa-dice-d20" aria-hidden="true" />
      </InlineButton>
      <ValidatedInput
        className="ed-input mono"
        value={hdVal}
        validate={validateHd}
        onCommit={onCommit}
        spellCheck={false}
        hint={hdDefault != null ? (
          <OverrideValue
            overridden={hdOverridden}
            defaultText={`default · ${hdDefault}`}
            onResetRequest={onResetRequest}
          />
        ) : undefined}
      />
    </div>
  );
}

const fmtMod = (n: number) => (n >= 0 ? "+" : "") + n;
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

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
const SKILL_DEFS: { k: "ld" | "od" | "sd" | "ft"; n: string }[] = [
  { k: "ld", n: "Listen at Door" },
  { k: "od", n: "Open Stuck Door" },
  { k: "sd", n: "Find Secret Door" },
  { k: "ft", n: "Find Room Trap" },
];

type ConfirmState = { title: string; body: string; fn: () => void } | null;

export function EditModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { actor, updateActor } = useOscSheetContext();
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const requestConfirm = (title: string, body: string, fn: () => void) => setConfirm({ title, body, fn });

  if (!open) return null;

  const sys = actor.system;
  const defaults = selectClassDefaults(actor);
  const set = (key: string, value: string | number) => void updateActor({ [key]: value });

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

  const footer = <Button variant="primary" onClick={onClose}>Close</Button>;

  return (
    <Modal open={open} title="Edit Character" onClose={onClose} footer={footer} className="fe-modal">
      <div className="fe-modal-body">

        {/* Identity */}
        <div className="ed-sec">
          <SectionTitle>Identity &amp; Vitals: <em className="ed-id-class">{sys.details.class.replace(/-/g, " ")}</em></SectionTitle>
          <div className="ed-id-top">
            <PortraitField src={actor.img} onPick={(path) => set("img", path)} />
            <div className="ed-id-grid">
              <label className="ed-field" style={{ gridColumn: "1 / span 8" }}>
                <span className="lab">Name</span>
                <ValidatedInput
                  className="ed-input"
                  value={actor.name}
                  validate={(v) => (v ? null : "name can’t be empty")}
                  onCommit={(v) => set("name", v)}
                />
              </label>
              <label className="ed-field" style={{ gridColumn: "9 / span 4" }}>
                <span className="lab">Title</span>
                <ValidatedInput
                  className="ed-input"
                  value={sys.details.title}
                  validate={() => null}
                  onCommit={(v) => set("system.details.title", v)}
                />
              </label>
            </div>
          </div>
          <div className="ed-idgrid">
            <label className="ed-field" style={{ gridColumn: "1 / span 3" }}>
              <span className="lab">Alignment</span>
              <select className="ed-input" value={sys.details.alignment} onChange={(e) => set("system.details.alignment", e.target.value)}>
                {ALIGNMENTS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </label>
            <label className="ed-field" style={{ gridColumn: "4 / span 3" }}>
              <span className="lab">Level</span>
              <NumberInput className="ed-input mono" value={level} min={1} max={defaults.maxLevel} onCommit={(n) => set("system.details.level", n)} />
            </label>
            <label className="ed-field" style={{ gridColumn: "7 / span 3" }}>
              <span className="lab">Current XP</span>
              <NumberInput className="ed-input mono" value={sys.details.xp.value} min={0} onCommit={(n) => set("system.details.xp.value", n)} />
            </label>
            <label className="ed-field" style={{ gridColumn: "10 / span 3" }}>
              <span className="lab">Next Level</span>
              <NumberInput className="ed-input mono" value={sys.details.xp.next} min={0} onCommit={(n) => set("system.details.xp.next", n)} />
              {nextXp != null && (
                <OverrideValue
                  overridden={sys.details.xp.next !== nextXp}
                  defaultText={`default · ${nextXp.toLocaleString()}`}
                  onResetRequest={() => requestConfirm("Reset Next Level?", `Revert to the class default of ${nextXp.toLocaleString()} XP.`, () => set("system.details.xp.next", nextXp))}
                />
              )}
            </label>

            <label className="ed-field" style={{ gridColumn: "1 / span 3" }}>
              <span className="lab">Current HP</span>
              <NumberInput className="ed-input mono" value={sys.hp.value} min={0} max={sys.hp.max} onCommit={(n) => set("system.hp.value", n)} />
            </label>
            <label className="ed-field" style={{ gridColumn: "4 / span 3" }}>
              <span className="lab">Max HP</span>
              <NumberInput className="ed-input mono" value={sys.hp.max} min={1} onCommit={(n) => set("system.hp.max", n)} />
            </label>
            <HitDiceField
              actor={actor}
              hdVal={hdVal}
              hdDefault={hdDefault}
              hdOverridden={hdOverridden}
              onCommit={(v) => set("system.hp.hd", v)}
              onResetRequest={() =>
                requestConfirm("Reset Hit Dice?", `Revert to the class default of ${hdDefault}.`, () => set("system.hp.hd", hdDefault!))
              }
            />
            <div className="ed-field" style={{ gridColumn: "10 / span 3" }}>
              <span className="lab">Initiative Mod</span>
              <NumberInput className="ed-input mono" value={initEff} onCommit={(n) => set("system.initiative.mod", n - dexInit)} />
              <OverrideValue
                overridden={initMod !== 0}
                defaultText={`DEX ${fmtMod(dexInit)}`}
                onResetRequest={() => requestConfirm("Reset Initiative?", `Revert to the rule default of DEX ${fmtMod(dexInit)}.`, () => set("system.initiative.mod", 0))}
              />
            </div>

            {isGM && classNames.length > 0 && (
              <label className="ed-field" style={{ gridColumn: "1 / span 6" }}>
                <span className="lab">Class <span className="hint">GM</span></span>
                <select className="ed-input" value={sys.details.class} onChange={(e) => set("system.details.class", e.target.value)}>
                  {!classNames.includes(sys.details.class) && (
                    <option value={sys.details.class}>{sys.details.class.replace(/-/g, " ")}</option>
                  )}
                  {classNames.map((c) => (
                    <option key={c} value={c}>{c.replace(/-/g, " ")}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        {/* Ability Scores */}
        <div className="ed-sec">
          <SectionTitle hint="raw scores">Ability Scores</SectionTitle>
          <div className="ed-cells ed-abil">
            {ABIL_ORDER.map((k) => {
              const req = defaults.requirements[k];
              const below = req != null && sys.scores[k].value < req;
              return (
                <StampCell
                  key={k}
                  stampKey={k.toUpperCase()}
                  value={sys.scores[k].value}
                  onChange={(n) => set(`system.scores.${k}.value`, clamp(n, 1, 20))}
                  min={1}
                  max={20}
                  warn={below}
                  warnTitle={below ? `${sys.details.class} requires ${k.toUpperCase()} ${req}+` : undefined}
                  caption={below ? `needs ${req}+` : `mod ${fmtMod(sys.scores[k].mod)}`}
                />
              );
            })}
          </div>
        </div>

        {/* Saving Throws */}
        <div className="ed-sec">
          <SectionTitle hint="roll ≥ target · default shown">Saving Throws</SectionTitle>
          <div className="ed-cells ed-save">
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
                  onResetRequest={def != null ? () => requestConfirm(`Reset ${n}?`, `Revert to the rule default of ${def}.`, () => set(`system.saves.${k}.value`, def)) : undefined}
                />
              );
            })}
          </div>
        </div>

        {/* Exploration */}
        <div className="ed-sec">
          <SectionTitle hint="1-in-6 chances">Exploration</SectionTitle>
          <div className="ed-skills">
            {SKILL_DEFS.map(({ k, n }) => (
              <label className="ed-field" key={k}>
                <span className="lab">{n}</span>
                <select className="ed-input mono" value={sys.exploration[k]} onChange={(e) => set(`system.exploration.${k}`, Number(e.target.value))}>
                  {[1, 2, 3, 4, 5, 6].map((x) => <option key={x} value={x}>{x}-in-6</option>)}
                </select>
              </label>
            ))}
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirm != null}
        title={confirm?.title ?? ""}
        body={confirm?.body ?? ""}
        confirmLabel="Reset"
        variant="primary"
        onConfirm={() => { confirm?.fn(); setConfirm(null); }}
        onCancel={() => setConfirm(null)}
      />
    </Modal>
  );
}
