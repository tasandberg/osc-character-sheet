import { IconButton } from "@ui/IconButton";
import { openGuide } from "./openGuide";

type Props = { to: string; topic: string; className?: string };

export function GuideLink({ to, topic, className }: Props) {
  return (
    <IconButton
      size="sm"
      className={className}
      aria-label={`Guide: ${topic}`}
      title={`Guide: ${topic}`}
      onClick={() => void openGuide(to)}
    >
      <i className="fa-solid fa-circle-question" aria-hidden="true" />
    </IconButton>
  );
}
