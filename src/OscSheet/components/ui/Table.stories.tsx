import { Table, Th, Td, Tr } from "./Table";
import { Stamp } from "./Stamp";

export default { title: "Data / Table" };

export const Weapons = () => (
  <Table>
    <thead>
      <Tr>
        <Th><Stamp>Weapon</Stamp></Th>
        <Th><Stamp>Damage</Stamp></Th>
        <Th num><Stamp>Atk</Stamp></Th>
      </Tr>
    </thead>
    <tbody>
      <Tr>
        <Td>Longsword</Td>
        <Td>1d8</Td>
        <Td num>+5</Td>
      </Tr>
      <Tr>
        <Td>Dagger</Td>
        <Td>1d4</Td>
        <Td num>+3</Td>
      </Tr>
    </tbody>
  </Table>
);

// Th has no sort prop yet, so a sortable header is composed by hand: a button
// child carries the click + aria-sort direction indicator. Documents the
// "sortable header" variant using current props.
// NOTE: the inventory/WealthSection tables are div-grids (role="row" + custom
// colhead + SortHeader), NOT this <table> primitive — that div-grid variant is
// intentionally out of ui Table's scope (needs dnd/density). See report §3.
export const SortableHeader = () => (
  <Table>
    <thead>
      <Tr>
        <Th aria-sort="ascending">
          <button type="button" style={{ all: "unset", cursor: "pointer" }}>
            Weapon <span aria-hidden="true">▲</span>
          </button>
        </Th>
        <Th num>
          <button type="button" style={{ all: "unset", cursor: "pointer" }}>
            Atk <span aria-hidden="true">▾</span>
          </button>
        </Th>
      </Tr>
    </thead>
    <tbody>
      <Tr>
        <Td>Dagger</Td>
        <Td num>+3</Td>
      </Tr>
      <Tr>
        <Td>Longsword</Td>
        <Td num>+5</Td>
      </Tr>
    </tbody>
  </Table>
);
