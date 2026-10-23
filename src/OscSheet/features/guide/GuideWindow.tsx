import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ContextConnector } from "foundry-vtt-react";
import { Empty } from "@ui/Empty";
import { Input } from "@ui/Field";
import { cx } from "@ui/cx";
import {
  findPage,
  locationHref,
  pages,
  parseLocation,
  searchGuide,
  sectionDomId,
  type GuideLocation,
  type HighlightPart,
} from "./content";
import { GuideMarkdown } from "./GuideMarkdown";

export const GUIDE_NAVIGATE = "navigate";

type Props = {
  initial?: string;
  connector?: ContextConnector<unknown>;
  onClose?: () => void;
};

type Focus = "search" | "content" | null;

function Highlighted({ parts }: { parts: HighlightPart[] }) {
  return (
    <>
      {parts.map((part, i) => (part.match ? <mark key={i}>{part.text}</mark> : part.text))}
    </>
  );
}

export function GuideWindow({ initial, connector, onClose }: Props) {
  const [location, setLocation] = useState<GuideLocation>(() => parseLocation(initial));
  const [focus, setFocus] = useState<Focus>(() => (parseLocation(initial).section ? "content" : "search"));
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);
  const articleRef = useRef<HTMLElement>(null);
  const listboxId = useId();
  const optionId = (i: number) => `${listboxId}-${i}`;

  const results = useMemo(() => searchGuide(query), [query]);
  const searching = query.trim().length > 0;
  const page = findPage(location.page);

  const go = useCallback((to: GuideLocation) => {
    setQuery("");
    setLocation({ ...to });
    setFocus("content");
  }, []);

  useEffect(
    () =>
      connector?.on(GUIDE_NAVIGATE, (target?: string) => {
        if (target) go(parseLocation(target));
        else setFocus("search");
      }),
    [connector, go],
  );

  useLayoutEffect(() => {
    if (!focus) return;
    if (focus === "search") searchRef.current?.focus();
    else {
      const article = articleRef.current;
      const heading = location.section
        ? article?.querySelector<HTMLElement>(`[id="${sectionDomId(location.section)}"]`)
        : article?.querySelector<HTMLElement>("h1");
      if (!location.section && article) article.scrollTop = 0;
      heading?.scrollIntoView({ block: "start" });
      heading?.focus({ preventScroll: true });
    }
    setFocus(null);
  }, [focus, location]);

  useEffect(() => {
    if (!searching) return;
    searchRef.current?.ownerDocument.getElementById(optionId(active))?.scrollIntoView({ block: "nearest" });
  });

  const onSearchKey =(e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!results.length) return;
      const step = e.key === "ArrowDown" ? 1 : -1;
      setActive((i) => (i + step + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const hit = results[active];
      if (hit) go({ page: hit.page, section: hit.section || undefined });
    } else if (e.key === "Escape" && query) {
      e.preventDefault();
      e.stopPropagation();
      setQuery("");
    }
  };

  const announcement = !searching
    ? ""
    : results.length
      ? `${results.length} ${results.length === 1 ? "result" : "results"} for ${query.trim()}`
      : `No results for ${query.trim()}`;

  const toc = page?.headings.filter((h) => h.depth >= 2 && h.depth <= 3) ?? [];

  return (
    <div
      className="osc-sheet-app osc-guide u-paper"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        e.preventDefault();
        e.stopPropagation();
        onClose?.();
      }}
    >
      <div className="tw:flex tw:items-center tw:gap-2 tw:border-b tw:border-(--hair-soft) tw:px-4 tw:py-3">
        <i className="fa-solid fa-magnifying-glass u-text-muted" aria-hidden="true" />
        <Input
          ref={searchRef}
          type="search"
          className="tw:flex-1"
          placeholder="Search the guide"
          aria-label="Search the guide"
          role="combobox"
          aria-expanded={searching}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={searching && results.length ? optionId(active) : undefined}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
          }}
          onKeyDown={onSearchKey}
        />
      </div>
      <div className="tw:sr-only" aria-live="polite" role="status">
        {announcement}
      </div>

      <div className="tw:flex tw:min-h-0 tw:flex-1 tw:@max-md/app:flex-col">
        <nav
          aria-label="Guide pages"
          className="osc-guide-pages tw:shrink-0 tw:overflow-y-auto tw:border-r tw:border-(--hair-soft) tw:py-3 tw:@max-md/app:border-r-0 tw:@max-md/app:border-b"
        >
          <ul>
            {pages.map((p) => (
              <li key={p.slug}>
                <a
                  href={locationHref({ page: p.slug })}
                  aria-current={p.slug === location.page && !searching ? "page" : undefined}
                  onClick={(e) => {
                    e.preventDefault();
                    go({ page: p.slug });
                  }}
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="tw:min-w-0 tw:flex-1 tw:overflow-y-auto" hidden={!searching}>
          <ul id={listboxId} role="listbox" aria-label="Search results" className="osc-guide-results">
            {results.map((hit, i) => (
              <li
                key={`${hit.page}#${hit.section}`}
                id={optionId(i)}
                role="option"
                aria-selected={i === active}
                className={cx(i === active && "is-active")}
                onMouseEnter={() => setActive(i)}
                onClick={() => go({ page: hit.page, section: hit.section || undefined })}
              >
                <span className="tw:block tw:text-(length:--fs-xs) u-text-muted">{hit.title}</span>
                <span className="tw:block tw:font-semibold">
                  <Highlighted parts={hit.heading} />
                </span>
                <span className="tw:block u-text-dim">
                  <Highlighted parts={hit.snippet} />
                </span>
              </li>
            ))}
          </ul>
          {!results.length && <Empty title="Nothing found" message="Try a different word." />}
        </div>

        <article
          ref={articleRef}
          aria-labelledby={page ? `osc-guide-title-${page.slug}` : undefined}
          className="osc-guide-article tw:min-w-0 tw:flex-1 tw:overflow-y-auto tw:px-6 tw:py-4"
          hidden={searching}
        >
          {page ? (
            <div className="osc-guide-prose">
              <h1 id={`osc-guide-title-${page.slug}`} tabIndex={-1}>
                {page.title}
              </h1>
              {page.summary && <p className="osc-guide-summary">{page.summary}</p>}
              {toc.length > 1 && (
                <nav aria-label="On this page" className="osc-guide-toc">
                  <h2>On this page</h2>
                  <ul>
                    {toc.map((h) => (
                      <li key={h.id} className={cx(h.depth === 3 && "tw:pl-4")}>
                        <a
                          href={locationHref({ page: page.slug, section: h.id })}
                          onClick={(e) => {
                            e.preventDefault();
                            go({ page: page.slug, section: h.id });
                          }}
                        >
                          {h.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              )}
              <GuideMarkdown nodes={page.body} onNavigate={go} />
            </div>
          ) : (
            <Empty title="The guide is empty" />
          )}
        </article>
      </div>
    </div>
  );
}
