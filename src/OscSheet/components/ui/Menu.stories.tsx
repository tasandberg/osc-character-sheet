import { Menu, MenuLabel, MenuSep, MenuItem } from "./Menu";

export default { title: "Overlays / Menu" };

export const List = () => (
  <Menu>
    <MenuLabel>Actions</MenuLabel>
    <MenuItem icon="✎" shortcut="⌘E">
      Edit
    </MenuItem>
    <MenuItem>Duplicate</MenuItem>
    <MenuSep />
    <MenuItem danger>Delete</MenuItem>
  </Menu>
);

export const Popover = () => (
  <div className="menu-host" style={{ position: "relative", height: 240 }}>
    <Menu popover open>
      <MenuLabel>Actions</MenuLabel>
      <MenuItem icon="✎" shortcut="⌘E">
        Edit
      </MenuItem>
      <MenuItem>Duplicate</MenuItem>
      <MenuSep />
      <MenuItem danger>Delete</MenuItem>
    </Menu>
  </div>
);
