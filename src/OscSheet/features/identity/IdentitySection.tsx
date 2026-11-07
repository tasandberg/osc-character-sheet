import { useState, type ReactNode } from "react";
import { useOscSheetContext } from "@app/context";
import { SectionHeader } from "@ui/SectionHeader";
import { Table, Th, Td, Tr } from "@ui/Table";
import { IconButton } from "@ui/IconButton";
import { InlineButton } from "@ui/InlineButton";
import { NumberInput } from "@ui/NumberInput";
import { ValidatedInput } from "@ui/ValidatedInput";
import { Combobox } from "@ui/Combobox";
import { OverrideValue } from "@ui/OverrideValue";
import { ConfirmDialog } from "@ui/ConfirmDialog";
import {
  availableClassNames,
  selectClassDefaults,
  selectProgression,
} from "@domain/classRules";
import type { OSEActor, OseClassItem, OseRaceItem } from "@domain/types";
import { classFace } from "./classFace";

const fmtPct = (n: number) => `${n >= 0 ? "+" : ""}${n}%`;

const openSheet = (item: OseClassItem | OseRaceItem) =>
  void item.sheet?.render(true);

function LabeledField({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label className={`field u-flex-1 ${className ?? ""}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}

function DeleteButton({
  item,
  actor,
}: {
  item: OseClassItem | OseRaceItem;
  actor: OSEActor;
}) {
  return (
    <IconButton
      variant="danger"
      size="sm"
      title={`Remove ${item.name}`}
      aria-label={`Remove ${item.name}`}
      onClick={() => void actor.removeGrantingItem(item)}
    >
      <i className="fas fa-trash" aria-hidden="true" />
    </IconButton>
  );
}

function ClassItemTable({
  actor,
  classes,
  canEdit,
}: {
  actor: OSEActor;
  classes: OseClassItem[];
  canEdit: boolean;
}) {
  const effectBonus = actor.system.xpBonusFromEffects ?? 0;
  return (
    <Table>
      <thead>
        <Tr>
          <Th>Class</Th>
          <Th num>Level</Th>
          <Th num>XP</Th>
          {canEdit && <Th aria-label="Controls" />}
        </Tr>
      </thead>
      <tbody>
        {classes.map((c) => {
          const next = c.system.nextRow?.xp ?? null;
          const bonus = (actor.system.classXpBonus?.(c) ?? 0) + effectBonus;
          return (
            <Tr key={c.id ?? c.name}>
              <Td>
                <InlineButton variant="link" onClick={() => openSheet(c)}>
                  {c.name}
                </InlineButton>
              </Td>
              <Td num>
                <NumberInput
                  className="input mono u-fs-sm tw:w-[calc(var(--spacer-12)*1.25)]"
                  aria-label={`${c.name} level`}
                  value={c.system.level}
                  min={1}
                  disabled={!canEdit}
                  onCommit={(n) => void c.update({ "system.level": n })}
                />
              </Td>
              <Td num>
                <div className="u-row u-gap-1 u-justify-end u-nowrap">
                  <NumberInput
                    className="input mono u-fs-sm tw:w-[calc(var(--spacer-12)*2)]"
                    aria-label={`${c.name} XP`}
                    value={c.system.xp}
                    min={0}
                    disabled={!canEdit}
                    onCommit={(n) => void c.update({ "system.xp": n })}
                  />
                  {next != null && (
                    <span className="u-fs-xs u-text-dim">
                      / {next.toLocaleString()}
                    </span>
                  )}
                  {bonus !== 0 && (
                    <span className="u-fs-xs u-text-brass" title="XP bonus">
                      {fmtPct(bonus)}
                    </span>
                  )}
                </div>
              </Td>
              {canEdit && (
                <Td>
                  <div className="u-row u-gap-1 u-justify-end u-nowrap">
                    {c.system.canLevelUp && (
                      <InlineButton
                        variant="link"
                        size="xs"
                        className="u-text-brass"
                        onClick={() => void actor.levelUp(c)}
                      >
                        <i className="fas fa-circle-up" aria-hidden="true" />{" "}
                        Level up {c.name}
                      </InlineButton>
                    )}
                    <DeleteButton item={c} actor={actor} />
                  </div>
                </Td>
              )}
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}

type ResetRequest = { next: number } | null;

function ActorClassFields({
  actor,
  canEdit,
  set,
}: {
  actor: OSEActor;
  canEdit: boolean;
  set: (key: string, value: string | number) => void;
}) {
  const [reset, setReset] = useState<ResetRequest>(null);
  const { details } = actor.system;
  const isGM = game.user?.isGM ?? false;
  const defaultNext = selectClassDefaults(actor).nextXp;
  return (
    <div className="u-row u-wrap u-gap-3 u-items-start">
      <LabeledField label="Class">
        <Combobox
          disabled={!canEdit || !isGM}
          value={details.class}
          options={availableClassNames().map((c) => ({
            value: c,
            label: c.replace(/-/g, " "),
            node: classFace(c),
          }))}
          onCommit={(v) => set("system.details.class", v)}
          renderValue={classFace}
          createHint="Type to set a custom class"
          newOptionLabel={(q) => `Custom: “${q}”`}
        />
      </LabeledField>
      <LabeledField label="Level">
        <NumberInput
          className="input mono"
          value={details.level}
          min={1}
          disabled={!canEdit}
          onCommit={(n) => set("system.details.level", n)}
        />
      </LabeledField>
      <LabeledField label="XP">
        <NumberInput
          className="input mono"
          value={details.xp.value}
          min={0}
          disabled={!canEdit}
          onCommit={(n) => set("system.details.xp.value", n)}
        />
        {details.xp.bonus ? (
          <span className="field-hint">
            XP bonus {fmtPct(details.xp.bonus)}
          </span>
        ) : null}
      </LabeledField>
      <LabeledField label="Next level">
        <NumberInput
          className="input mono"
          value={details.xp.next ?? 0}
          min={0}
          disabled={!canEdit}
          onCommit={(n) => set("system.details.xp.next", n)}
        />
        {canEdit && defaultNext != null && (
          <OverrideValue
            overridden={details.xp.next !== defaultNext}
            defaultText={`default · ${defaultNext.toLocaleString()}`}
            onResetRequest={() => setReset({ next: defaultNext })}
          />
        )}
      </LabeledField>
      <ConfirmDialog
        open={reset != null}
        title="Reset Next Level?"
        body={`Revert to the class default of ${reset?.next.toLocaleString()} XP.`}
        confirmLabel="Reset"
        onConfirm={() => {
          if (reset) set("system.details.xp.next", reset.next);
          setReset(null);
        }}
        onCancel={() => setReset(null)}
      />
    </div>
  );
}

export function IdentitySection() {
  const { actor, updateActor, canEdit } = useOscSheetContext();
  const { source, classes, race } = selectProgression(actor);
  const set = (key: string, value: string | number) =>
    void updateActor({ [key]: value });
  const storedTitle =
    actor._source?.system?.details?.title ?? actor.system.details.title;

  return (
    <section className="osc-section u-stack" aria-label="Identity">
      <SectionHeader title="Identity" />
      {source === "item" ? (
        <ClassItemTable actor={actor} classes={classes} canEdit={canEdit} />
      ) : (
        <ActorClassFields actor={actor} canEdit={canEdit} set={set} />
      )}
      <div className="u-row u-wrap u-gap-3 u-items-end">
        {race && (
          <div className="field">
            <span className="field-label">Race</span>
            <div className="u-row u-gap-1">
              <InlineButton variant="link" onClick={() => openSheet(race)}>
                {race.name}
              </InlineButton>
              {canEdit && <DeleteButton item={race} actor={actor} />}
            </div>
          </div>
        )}
        <LabeledField label="Title">
          <ValidatedInput
            className="input"
            value={storedTitle}
            placeholder={actor.system.details.title}
            disabled={!canEdit}
            validate={() => null}
            onCommit={(v) => set("system.details.title", v)}
          />
        </LabeledField>
      </div>
    </section>
  );
}
