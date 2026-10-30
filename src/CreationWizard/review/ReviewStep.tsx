import { useRef, type ReactNode } from "react";
import { cx } from "@ui/cx";
import {
  ALIGNMENTS,
  parseHitPoints,
  spellSlots,
  type CharacterDetails,
  type DetailsDraft,
} from "../details/detailsDraft";
import { goldLeft, itemCount, type GearDraft } from "../gear/gearDraft";
import { useLoadPreview } from "../gear/useLoadPreview";
import { MoreBelow } from "../MoreBelow";
import type { PortraitDraft } from "../portrait/portraitDraft";
import { PortraitPicker } from "../portrait/PortraitPicker";
import { RecordRows, type RecordRow } from "../RecordRows";
import { ordinal, type CreationRace } from "../race/raceDraft";
import type { CreationClass, CreationRules } from "../rules";
import {
  characterLanguages,
  formatXpModifier,
  xpAdjustment,
} from "../class/classDraft";
import { formatModifier } from "../scores/scoreFace";
import {
  ABILITIES,
  abbreviation,
  type AbilityScores,
} from "../scores/scoresDraft";
import { useCompendiumDetail } from "../useCompendiumDetail";

type Props = {
  details: DetailsDraft;
  character: CharacterDetails;
  cls: CreationClass;
  race?: CreationRace;
  scores: AbilityScores;
  gear: GearDraft;
  rules: CreationRules;
  onChangeGear: () => void;
  onChangePortrait: (portrait: PortraitDraft) => void;
};

function Tile({
  stamp,
  figure,
  mod,
  tone,
  title,
}: {
  stamp: string;
  figure: ReactNode;
  mod?: number;
  tone?: "hp" | "ac";
  title?: string;
}) {
  return (
    <div
      className="osc-creation-review-tile vm-score-tile vm-score-tile-sm-sunk u-flex-none"
      title={title}
    >
      <span className="vm-score-stamp vm-score-stamp-strip" aria-hidden="true">
        {stamp}
      </span>
      <span className="vm-score-face vm-score-face-sunk">
        <span
          className={cx(
            "vm-score-figure",
            tone === "hp" && "osc-creation-review-hp",
            tone === "ac" && "osc-creation-review-ac",
          )}
        >
          {figure}
        </span>
        {mod !== undefined && (
          <span className="vm-score-mod">{formatModifier(mod)}</span>
        )}
      </span>
    </div>
  );
}

function Blurb({
  title,
  loaded,
}: {
  title: string;
  loaded: { status: string; detail?: { description?: string } };
}) {
  const html = loaded.status === "ready" ? loaded.detail?.description : "";
  return (
    <section className="u-stack u-gap-1" aria-label={title}>
      <h3 className="vm-heading vm-heading-sm u-fs-lg">{title}</h3>
      {html ? (
        <div
          className="osc-creation-review-blurb u-fs-sm u-text-dim"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        loaded.status !== "loading" && (
          <p className="vm-help">No description found in the compendiums.</p>
        )
      )}
    </section>
  );
}

function AlignmentBlurb({
  title,
  value,
  load,
}: {
  title: string;
  value: DetailsDraft["alignment"];
  load: CreationRules["alignmentText"];
}) {
  const loaded = useCompendiumDetail("alignment", load);
  const text =
    loaded.status === "ready" && value ? loaded.detail[value] : undefined;
  return (
    <Blurb
      title={title}
      loaded={{ status: loaded.status, detail: { description: text } }}
    />
  );
}

function RaceBlurb({
  race,
  load,
}: {
  race: CreationRace;
  load: CreationRules["raceDetail"];
}) {
  const loaded = useCompendiumDetail(race.uuid, load);
  return <Blurb title={race.name} loaded={loaded} />;
}

function ClassBlurb({
  cls,
  load,
}: {
  cls: CreationClass;
  load: CreationRules["classDetail"];
}) {
  const loaded = useCompendiumDetail(cls.uuid, load);
  return <Blurb title={cls.name} loaded={loaded} />;
}

function Inventory({
  gear,
  rules,
  scores,
  onChangeGear,
}: Pick<Props, "gear" | "rules" | "scores" | "onChangeGear">) {
  const preview = useLoadPreview({ draft: gear, rules, scores });
  const count = itemCount(gear);
  const load = preview?.enabled
    ? `${preview.label}${preview.tier ? `, ${preview.tier.toLowerCase()}` : ""}`
    : undefined;
  const hint = [
    `${goldLeft(gear)} gp left of ${gear.gold?.total ?? 0}`,
    load,
    preview && `moves ${preview.movement.base}′`,
  ]
    .filter(Boolean)
    .join(" · ");
  const columns = gear.cart.length > 8 ? 3 : gear.cart.length > 4 ? 2 : 1;
  return (
    <section className="u-stack u-gap-1" aria-label="Inventory">
      <div className="osc-creation-review-inventory-head u-row u-gap-2">
        <span className="vm-heading vm-heading-sm u-fs-lg">Inventory</span>
        <span className="vm-tab-count">{count}</span>
        <span className="vm-sheet-head-hint u-fs-xs">{hint}</span>
        <span className="u-flex-1" />
        <button
          type="button"
          className="vm-btn vm-btn-link vm-btn-sm"
          onClick={onChangeGear}
        >
          Change gear
        </button>
      </div>
      {gear.cart.length ? (
        <ul
          className={cx(
            "osc-creation-review-leaders u-grid",
            columns === 1 && "tw:grid-cols-1",
            columns === 2 && "u-grid-2",
            columns === 3 && "u-grid-3",
          )}
          aria-label="Pack"
        >
          {gear.cart.map(({ item, quantity }) => (
            <li
              key={item.uuid}
              className="osc-creation-review-leader-line u-flex u-items-baseline u-gap-2 u-fs-sm"
            >
              <span>
                {item.name}
                {quantity > 1 && ` ×${quantity}`}
              </span>
              <span className="osc-creation-review-leader u-flex-1" />
              <span className="vm-mono u-fs-2xs u-text-dim">
                {item.cost * quantity} gp ·{" "}
                {item.weight ? `${item.weight * quantity} cn` : "—"}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="vm-help">No gear.</p>
      )}
    </section>
  );
}

export function ReviewStep({
  details,
  character,
  cls,
  race,
  scores,
  gear,
  rules,
  onChangeGear,
  onChangePortrait,
}: Props) {
  const paneRef = useRef<HTMLDivElement>(null);
  const asideRef = useRef<HTMLElement>(null);
  const modifiers = rules.modifiers(scores);
  const xp = xpAdjustment(cls, scores, rules.xpBonus);
  const { stats, level } = character;
  const alignment = ALIGNMENTS.find((a) => a.value === details.alignment);
  const languages = characterLanguages(cls, race?.languages ?? []).join(", ");
  const hitPoints = parseHitPoints(character.hitPoints?.value) ?? "—";
  const hpTitle = character.hitPoints?.dice
    ? `Rolled ${stats.hd}`
    : character.hitPoints?.maximum
      ? `${stats.hd}, max by house rule`
      : stats.hd;
  const slots = spellSlots(stats);
  const name = details.name.trim();
  const preview = useLoadPreview({ draft: gear, rules, scores });
  const characterRows: RecordRow[] = [
    ["Alignment", alignment?.label ?? "—"],
    [
      "XP bonus",
      xp ? `${formatXpModifier(xp.modifier)} from ${xp.basis}` : "None",
    ],
    ["Languages", languages],
  ];
  const advancement: RecordRow[] = [
    ["Experience", `${stats.xp.toLocaleString()} xp`],
    [
      "Next level",
      stats.nextXp === null ? "—" : `${stats.nextXp.toLocaleString()} xp`,
    ],
    ["Max level", ordinal(character.cap)],
    ["Hit dice", stats.hd],
    ["THAC0", `${stats.thac0} [${formatModifier(stats.bba)}]`],
    ...(cls.casts
      ? ([
          [
            "Spell slots",
            slots.length
              ? slots.map((s) => `${s.level} ${s.count}`).join(" · ")
              : "None yet",
          ],
        ] as RecordRow[])
      : []),
  ];

  return (
    <div className="osc-creation-split osc-creation-review-step">
      <div
        ref={paneRef}
        className="osc-creation-pane osc-creation-review-pane u-gap-4"
      >
        <div className="osc-creation-review-head u-flex u-items-center u-gap-4 u-pb-3">
          <PortraitPicker
            draft={details.portrait}
            size="sm"
            alt={name}
            onChange={onChangePortrait}
          />
          <div className="u-flex u-flex-1 tw:flex-col u-gap-1">
            <h2 className="vm-sheet-head-title u-fs-3xl tw:leading-none">
              {name}
            </h2>
            <span className="vm-sheet-head-hint">
              {race ? `${race.name} ${cls.name}` : cls.name} · level {level}
            </span>
          </div>
        </div>
        <section className="u-stack u-gap-2" aria-label="Vital statistics">
          <h3 className="vm-heading vm-heading-sm u-fs-lg">Vital statistics</h3>
          <div className="u-flex u-gap-2">
            <div className="u-flex u-gap-2" aria-label="Ability scores">
              {ABILITIES.map((a) => (
                <Tile
                  key={a}
                  stamp={abbreviation(a)}
                  figure={scores[a]}
                  mod={modifiers[a] ?? 0}
                />
              ))}
            </div>
            <span
              className="osc-creation-review-divider u-mx-2"
              aria-hidden="true"
            />
            <div className="u-flex u-gap-2" aria-label="Combat">
              <Tile stamp="HP" figure={hitPoints} tone="hp" title={hpTitle} />
              <Tile stamp="AC" figure={preview?.armourClass ?? "—"} tone="ac" />
            </div>
          </div>
        </section>
        <div className="osc-creation-review-pair u-grid u-grid-2 u-gap-8">
          <section className="u-stack u-gap-1" aria-label="Advancement">
            <h3 className="vm-heading vm-heading-sm u-fs-lg">Advancement</h3>
            <RecordRows rows={advancement} />
          </section>
          <section className="u-stack u-gap-1" aria-label="Character">
            <h3 className="vm-heading vm-heading-sm u-fs-lg">Character</h3>
            <RecordRows rows={characterRows} />
          </section>
        </div>
        <section className="u-stack u-gap-1" aria-label="Saving throws">
          <h3 className="vm-heading vm-heading-sm u-fs-lg">Saving throws</h3>
          <RecordRows
            rows={rules.saveNames.map((save, i) => [save, stats.saves[i]])}
          />
        </section>
        <Inventory
          gear={gear}
          rules={rules}
          scores={scores}
          onChangeGear={onChangeGear}
        />
        <MoreBelow scroller={paneRef} contentKey={gear.cart.length} />
      </div>
      <aside
        ref={asideRef}
        className="osc-creation-aside osc-creation-review-aside u-stack u-gap-4"
        aria-label="About this character"
      >
        {race && <RaceBlurb race={race} load={rules.raceDetail} />}
        <ClassBlurb cls={cls} load={rules.classDetail} />
        {alignment && (
          <AlignmentBlurb
            title={alignment.label}
            value={alignment.value}
            load={rules.alignmentText}
          />
        )}
        <MoreBelow scroller={asideRef} contentKey={cls.uuid} />
      </aside>
    </div>
  );
}
