import { useEffect, useState } from "react";

export function useEnrichedHtml(html: string, relativeTo: unknown): string {
  const [enriched, setEnriched] = useState("");

  useEffect(() => {
    let live = true;
    if (!html) {
      setEnriched("");
      return;
    }
    foundry.applications.ux.TextEditor.enrichHTML(html, {
      secrets: !!(relativeTo as { isOwner?: boolean } | null)?.isOwner,
      documents: true,
      links: true,
      rolls: true,
      relativeTo: relativeTo as foundry.abstract.Document.Any,
    }).then((result) => {
      if (live) setEnriched(result);
    });
    return () => {
      live = false;
    };
  }, [html, relativeTo]);

  return enriched;
}
