import { usePortraitUploadGate } from "@features/portraitImage/usePortraitDrop";
import { canBrowseFiles } from "@ui/imagePicker";

export function useCanChoosePortrait(): boolean {
  const canUpload = usePortraitUploadGate().ready;
  return canUpload || canBrowseFiles();
}
