import { Fragment, useLayoutEffect, useRef } from "react";
import type { IdentityVM } from "@domain/vm-types";

function useFitText(text: string, min = 0.6) {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      el.style.setProperty("--fit-scale", "1");
      const avail = el.clientWidth;
      const needed = el.scrollWidth;
      const scale = needed > avail && needed > 0 ? Math.max(min, avail / needed) : 1;
      el.style.setProperty("--fit-scale", String(scale));
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [text, min]);
  return ref;
}

const ITEM_LINK =
  "tw:cursor-pointer tw:p-0 tw:font-[inherit] tw:text-inherit tw:transition-[color] tw:duration-[120ms] tw:hover:text-[var(--osc-link-hover,var(--gold))] tw:focus-visible:outline-2 tw:focus-visible:outline-offset-2 tw:focus-visible:outline-gold";

function ItemLink({
  id,
  label,
  onOpen,
}: {
  id?: string;
  label: string;
  onOpen?: (id: string) => void;
}) {
  if (!id || !onOpen) return <>{label}</>;
  return (
    <button
      type="button"
      className={ITEM_LINK}
      title={`Open ${label}`}
      onClick={() => onOpen(id)}
    >
      {label}
    </button>
  );
}

function ClassLine({
  identity,
  onOpenItem,
}: {
  identity: IdentityVM;
  onOpenItem?: (id: string) => void;
}) {
  return (
    <span className="tw:text-gold-dim">
      {identity.race && (
        <>
          <ItemLink id={identity.raceId} label={identity.race} onOpen={onOpenItem} />{" "}
        </>
      )}
      <span className="tw:font-medium">
        {identity.classes?.length
          ? identity.classes.map((c, i) => (
              <Fragment key={c.id}>
                {i > 0 && " / "}
                <ItemLink id={c.id} label={c.label} onOpen={onOpenItem} />
              </Fragment>
            ))
          : identity.classLevels}
      </span>
    </span>
  );
}

export function Identity({
  identity,
  showClassLine = true,
  onOpenItem,
}: {
  identity: IdentityVM;
  showClassLine?: boolean;
  onOpenItem?: (id: string) => void;
}) {
  const nameRef = useFitText(identity.name);
  const standing = identity.title;
  return (
    <div className="osc-ident tw:flex tw:min-w-0 tw:flex-col tw:gap-[calc(var(--spacer-1)*2.25)] tw:@max-md/app:overflow-hidden tw:@twopane/sheet:w-full tw:@twopane/sheet:items-center tw:@twopane/sheet:text-center">
      {/* padding + equal negative margin: layout unchanged, clip box grows so the display face's J survives */}
      <div
        className="osc-name tw:overflow-hidden tw:p-[0.14em] tw:-mx-[0.14em] tw:-mb-[0.14em] tw:mt-[calc(var(--spacer-1)-0.26em)] tw:font-display tw:leading-[0.95] tw:tracking-[0.01em] tw:whitespace-nowrap tw:text-text tw:@max-md/app:text-ellipsis tw:@twopane/sheet:self-stretch tw:@twopane/sheet:text-center"
        ref={nameRef}
      >
        {identity.name}
      </div>
      {showClassLine && (
        <div className="u-text-dim tw:font-sans tw:text-(length:--fs-base) tw:-my-1 tw:leading-[calc(1em+var(--spacer-2))] tw:@max-md/app:text-(length:--fs-sm) tw:@twopane/sheet:text-center">
          <ClassLine identity={identity} onOpenItem={onOpenItem} />
          {(standing || identity.alignment) && (
            <>
              {" · "}
              {standing}
              {standing && identity.alignment && " · "}
              {identity.alignment}
            </>
          )}
        </div>
      )}
    </div>
  );
}
