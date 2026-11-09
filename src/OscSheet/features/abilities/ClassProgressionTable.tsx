import { useState } from "react";
import { InlineButton } from "@ui/InlineButton";
import { Modal } from "@ui/Modal";
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

export function ProgressionLink({ table }: { table: ClassTable }) {
  const [open, setOpen] = useState(false);
  const title = label("OSE.classes.TabProgression");
  return (
    <>
      <InlineButton
        variant="link"
        size="sm"
        className="u-nowrap u-flex-none"
        aria-haspopup="dialog"
        aria-label={`${table.name} ${title}`}
        onClick={() => setOpen(true)}
      >
        {title}
      </InlineButton>
      <Modal
        open={open}
        title={table.name}
        onClose={() => setOpen(false)}
        className="modal-inset"
      >
        <ProgressionTable table={table} />
      </Modal>
    </>
  );
}
