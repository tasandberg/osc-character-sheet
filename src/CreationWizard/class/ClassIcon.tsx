import { classIcon } from "@old-school-chronicle/vellum/icons";
import {
  OscIcon,
  type OscIconColor,
} from "@old-school-chronicle/vellum/icons/react";

type Props = {
  name: string;
  size: number;
  color: OscIconColor;
  holdSpace?: boolean;
};

export function ClassIcon({ name, size, color, holdSpace }: Props) {
  const icon = classIcon(name);
  if (icon) return <OscIcon name={icon} size={size} color={color} />;
  if (!holdSpace) return null;
  return (
    <span
      className="tw:inline-block tw:shrink-0"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
  );
}
