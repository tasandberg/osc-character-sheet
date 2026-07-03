import type { OSEActor } from "@domain/types";

type ShowArtSelect = (
  search: string,
  options: {
    searchType?: string;
    object?: unknown;
    callback?: (imgSrc: string) => void;
  },
) => Promise<void>;

type TvaModule = {
  active: boolean;
  api?: {
    showArtSelect?: ShowArtSelect;
    TVA_CONFIG?: {
      permissions?: { portrait_right_click?: Record<number, boolean> };
    };
  };
};

/**
 * Token Variant Art bridge. TVA wires portrait right-click via the v1
 * `renderActorSheet` hook, which our ApplicationV2 sheet never fires — so we
 * call its public API (`game.modules.get("token-variants").api.showArtSelect`)
 * ourselves, mirroring TVA's own default-sheet handler: search by actor name,
 * searchType "Portrait", picked image → `actor.img`. Gated the same way
 * (editable sheet + TVA's portrait_right_click role permission). No-ops when
 * TVA is absent or inactive.
 */
export function showTokenVariantsPortraitPicker(actor: OSEActor) {
  const tva = game.modules.get("token-variants") as TvaModule | undefined;
  if (!tva?.active || !tva.api?.showArtSelect) return;
  if (!actor.isOwner) return;
  const perm = tva.api.TVA_CONFIG?.permissions?.portrait_right_click;
  if (perm && !perm[game.user.role]) return;
  void tva.api.showArtSelect(actor.name, {
    searchType: "Portrait",
    object: actor,
    callback: (imgSrc) => void actor.update({ img: imgSrc }),
  });
}
