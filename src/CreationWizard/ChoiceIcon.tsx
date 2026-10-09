import { classIcon } from "@old-school-chronicle/vellum/icons";
import {
  OscIcon,
  type OscIconColor,
} from "@old-school-chronicle/vellum/icons/react";

type Props = {
  name: string;
  size: number;
  color: OscIconColor;
  className?: string;
};

export function ChoiceIcon({ name, size, color, className }: Props) {
  const icon = classIcon(name);
  return icon ? (
    <OscIcon name={icon} size={size} color={color} className={className} />
  ) : null;
}
