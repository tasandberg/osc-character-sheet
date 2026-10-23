import { MODULE_ID } from "@domain/flags";
import "../../styles/guide.scss";

export const GUIDE_APP_ID = `${MODULE_ID}-guide`;

export async function openGuide(target?: string): Promise<void> {
  const { default: OscGuide } = await import("@src/applications/osc-guide");
  await OscGuide.open(target);
}
