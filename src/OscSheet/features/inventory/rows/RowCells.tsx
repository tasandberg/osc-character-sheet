import { Fragment } from "react/jsx-runtime";
import { INV_COLUMNS, type RowCtx } from "./columns";

export function RowCells({ ctx }: { ctx: RowCtx }) {
  return (
    <>
      {INV_COLUMNS.map((c) => (
        <Fragment key={c.key}>{c.cell(ctx)}</Fragment>
      ))}
    </>
  );
}
