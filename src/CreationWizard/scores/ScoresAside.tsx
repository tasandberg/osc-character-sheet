import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import { cx } from "@ui/cx";
import { xpAdjustment } from "../class/classDraft";
import { XpAdjustmentText } from "../class/XpAdjustmentText";
import { MoreBelow } from "../MoreBelow";
import {
  formatModifiers,
  raceStanding,
  type CreationRace,
} from "../race/raceDraft";
import type { CreationClass, CreationRules } from "../rules";
import { classStanding } from "./classStanding";
import { ABILITIES, abbreviation, type AbilityScores } from "./scoresDraft";

type Standing = {
  key: string;
  name: string;
  failed: boolean;
  note: ReactNode;
};

type ListId = "race" | "class";

type StandingList = { id: ListId; title: string; standings: Standing[] };

type Props = {
  races: CreationRace[];
  classes: CreationClass[];
  scores: AbilityScores;
  xpBonus: CreationRules["xpBonus"];
};

const raceModifiers = (race: CreationRace) => {
  const mods = formatModifiers(race.modifiers);
  return mods === "None" ? "no modifiers" : mods;
};

const KEY_STEPS: Record<string, (index: number, count: number) => number> = {
  ArrowRight: (index, count) => (index + 1) % count,
  ArrowLeft: (index, count) => (index - 1 + count) % count,
  Home: () => 0,
  End: (_, count) => count - 1,
};

export function ScoresAside({ races, classes, scores, xpBonus }: Props) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const [selected, setSelected] = useState<ListId>("race");
  const unknown = ABILITIES.filter((a) => scores[a] === undefined);

  const heading = (
    <div className="u-flex-none">
      <div className="vm-sheet-head">
        <h2 id={`${id}-heading`} className="vm-sheet-head-title">
          Available options
        </h2>
      </div>
      <p className="vm-help">
        {unknown.length === ABILITIES.length
          ? "Roll or enter scores to see your options."
          : "Listed are the available character options based on your scores."}
      </p>
    </div>
  );

  if (unknown.length === ABILITIES.length)
    return (
      <aside className="osc-creation-aside" aria-labelledby={`${id}-heading`}>
        {heading}
      </aside>
    );

  const lists: StandingList[] = [
    ...(races.length > 0
      ? [
          {
            id: "race" as const,
            title: "Races",
            standings: races.map((race) => {
              const { status, note } = raceStanding(race, scores);
              return {
                key: race.uuid,
                name: race.name,
                failed: status === "failed",
                note: status === "open" ? raceModifiers(race) : note,
              };
            }),
          },
        ]
      : []),
    {
      id: "class",
      title: "Classes",
      standings: classes.map((cls) => {
        const { name, status, note } = classStanding(cls, scores);
        if (cls.unusable)
          return { key: cls.uuid, name, failed: true, note: cls.unusable };
        return {
          key: cls.uuid,
          name,
          failed: status === "failed",
          note:
            status !== "open"
              ? note
              : xpAdjustment(cls, scores, xpBonus) && (
                  <XpAdjustmentText
                    cls={cls}
                    scores={scores}
                    xpBonus={xpBonus}
                  />
                ),
        };
      }),
    },
  ];
  const shown = lists.find((list) => list.id === selected) ?? lists[0];
  const tabbed = lists.length > 1;
  const label = ({ title, standings }: StandingList) =>
    unknown.length
      ? title
      : `${title} (${standings.filter((s) => !s.failed).length}/${standings.length})`;
  const tabId = (list: StandingList) => `${id}-${list.id}-tab`;

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const step = KEY_STEPS[event.key];
    if (!step) return;
    event.preventDefault();
    const index = step(lists.indexOf(shown), lists.length);
    setSelected(lists[index].id);
    const tabs = tabsRef.current?.querySelectorAll<HTMLElement>('[role="tab"]');
    tabs?.[index]?.focus();
  };

  return (
    <aside
      className="osc-creation-aside osc-creation-scores-aside u-stack u-gap-2"
      aria-labelledby={`${id}-heading`}
    >
      {heading}
      {tabbed ? (
        <div
          ref={tabsRef}
          className="vm-tabs u-flex-none"
          role="tablist"
          aria-label="Race or class"
          onKeyDown={onKeyDown}
        >
          {lists.map((list) => (
            <button
              key={list.id}
              type="button"
              role="tab"
              id={tabId(list)}
              className="vm-tab osc-creation-nowrap"
              aria-selected={list === shown}
              aria-controls={`${id}-panel`}
              tabIndex={list === shown ? 0 : -1}
              onClick={() => setSelected(list.id)}
            >
              {label(list)}
            </button>
          ))}
        </div>
      ) : (
        <div className="vm-tabs u-flex-none">
          <h3
            id={tabId(shown)}
            className="vm-tab vm-active osc-creation-scores-aside-head"
          >
            {label(shown)}
          </h3>
        </div>
      )}
      <div
        ref={scrollerRef}
        id={`${id}-panel`}
        role={tabbed ? "tabpanel" : undefined}
        aria-labelledby={tabbed ? tabId(shown) : undefined}
        tabIndex={tabbed ? 0 : undefined}
        className="osc-creation-scores-aside-scroller"
      >
        {unknown.length > 0 && (
          <p className="vm-help u-pb-1">
            waiting on {unknown.map(abbreviation).join(", ")}
          </p>
        )}
        <ul aria-labelledby={tabId(shown)}>
          {shown.standings.map(({ key, name, failed, note }) => (
            <li
              key={key}
              className="u-row u-wrap u-justify-between u-gap-x-3 u-gap-y-1 u-py-1"
              aria-disabled={failed || undefined}
            >
              <span
                className={cx(
                  "osc-creation-nowrap u-fs-sm",
                  failed && "u-text-muted",
                )}
              >
                {name}
              </span>
              {note && (
                <span
                  className={cx(
                    "osc-creation-nowrap vm-mono u-fs-2xs tw:font-medium",
                    failed
                      ? "osc-creation-scores-aside-failed-note"
                      : "u-text-dim",
                  )}
                >
                  {failed ? <>Requires {note}</> : note}
                </span>
              )}
            </li>
          ))}
        </ul>
      </div>
      <MoreBelow scroller={scrollerRef} contentKey={shown.id} docked />
    </aside>
  );
}
