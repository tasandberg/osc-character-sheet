import { useState } from "react";
import { InlineButton } from "@ui/InlineButton";
import { Table, Th, Td, Tr } from "@ui/Table";
import { effectsLabel as label } from "@features/effects/effects";
import type { ClassTable } from "./classProgression";

function ProgressionTable({ table }: { table: ClassTable }) {
  const conHint = label("OSE.classes.HdConHint");
  const slotsHint = label("OSE.classes.SpellSlots");
  return (
    <div className="tw:overflow-x-auto">
      <Table className="osc-class-progression-table">
        <thead>
          <Tr>
            <Th>{label("OSE.details.level")}</Th>
            <Th num>{label("OSE.classes.XpShort")}</Th>
            <Th>{label("OSE.HitDice")}</Th>
            <Th title={conHint}>{label("OSE.scores.con.short")}</Th>
            <Th num>{label("OSE.Thac0")}</Th>
            <Th num>{label("OSE.AB")}</Th>
            {table.saveKeys.map((key) => (
              <Th num key={key} title={label(`OSE.saves.${key}.long`)}>
                {label(`OSE.saves.${key}.short`)}
              </Th>
            ))}
            {table.spellLevels.map((lvl) => (
              <Th num key={lvl} title={slotsHint}>
                {lvl}
              </Th>
            ))}
          </Tr>
        </thead>
        <tbody>
          {table.rows.map((row) => (
            <Tr key={row.level} aria-current={row.current ? "true" : undefined}>
              <Td num>{row.level}</Td>
              <Td num>{row.xp.toLocaleString()}</Td>
              <Td>{row.hd}</Td>
              <Td>
                {row.hdcon && (
                  <i
                    className="fas fa-check"
                    role="img"
                    aria-label={conHint}
                    title={conHint}
                  />
                )}
              </Td>
              <Td num>{row.thac0}</Td>
              <Td num>{row.bba}</Td>
              {row.saves.map((save, i) => (
                <Td num key={table.saveKeys[i]}>
                  {save}
                </Td>
              ))}
              {row.spellSlots.map((slots, i) => (
                <Td num key={table.spellLevels[i]}>
                  {slots || ""}
                </Td>
              ))}
            </Tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
}

export function ProgressionToggle({ table }: { table: ClassTable }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="u-stack u-mb-3">
      <InlineButton
        variant="link"
        size="sm"
        className="ft-chev tw:self-start"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="u-row u-gap-1">
          <i className="fa-solid fa-chevron-right" aria-hidden="true" />
          {label("OSE.classes.TabProgression")}
        </span>
      </InlineButton>
      {open && <ProgressionTable table={table} />}
    </div>
  );
}
