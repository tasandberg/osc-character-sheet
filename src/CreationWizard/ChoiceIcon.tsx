import { classIcon } from "@old-school-chronicle/vellum/icons";
import {
  OscIcon,
  type OscIconColor,
} from "@old-school-chronicle/vellum/icons/react";

type Props = {
  name: string;
  iconKey?: string;
  size: number;
  color: OscIconColor;
  className?: string;
};

export function ChoiceIcon({ name, iconKey, size, color, className }: Props) {
  const icon = classIcon(name) ?? (iconKey ? classIcon(iconKey) : undefined);
  return icon ? (
    <OscIcon name={icon} size={size} color={color} className={className} />
  ) : null;
}
