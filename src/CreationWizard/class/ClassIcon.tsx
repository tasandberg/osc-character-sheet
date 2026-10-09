import { classIcon } from "@old-school-chronicle/vellum/icons";
import {
  OscIcon,
  type OscIconColor,
} from "@old-school-chronicle/vellum/icons/react";

type Props = {
  name: string;
  size: number;
  color: OscIconColor;
};

export function ClassIcon({ name, size, color }: Props) {
  const icon = classIcon(name);
  return icon ? <OscIcon name={icon} size={size} color={color} /> : null;
}
