import type { ReactNode } from "react";
import type { GuideNode } from "./model";
import { locationHref, sectionDomId, type GuideLocation } from "./content";

const SAFE_URL = /^(https?:|mailto:)/i;

type Props = { nodes: GuideNode[]; onNavigate: (to: GuideLocation) => void };

export function GuideMarkdown({ nodes, onNavigate }: Props) {
  const render = (list: GuideNode[]): ReactNode[] => list.map((node, i) => renderNode(node, i));

  function renderNode(node: GuideNode, key: number): ReactNode {
    switch (node.type) {
      case "text":
        return node.value;
      case "break":
        return <br key={key} />;
      case "thematicBreak":
        return <hr key={key} />;
      case "inlineCode":
        return <code key={key}>{node.value}</code>;
      case "code":
        return (
          <pre key={key}>
            <code>{node.value}</code>
          </pre>
        );
      case "image":
        return <img key={key} src={node.src} alt={node.alt} loading="lazy" />;
      case "heading": {
        const Tag = `h${Math.min(6, Math.max(2, node.depth))}` as "h2";
        return (
          <Tag key={key} id={node.id ? sectionDomId(node.id) : undefined} tabIndex={-1}>
            {render(node.children)}
          </Tag>
        );
      }
      case "paragraph":
        return <p key={key}>{render(node.children)}</p>;
      case "blockquote":
        return <blockquote key={key}>{render(node.children)}</blockquote>;
      case "emphasis":
        return <em key={key}>{render(node.children)}</em>;
      case "strong":
        return <strong key={key}>{render(node.children)}</strong>;
      case "delete":
        return <del key={key}>{render(node.children)}</del>;
      case "list": {
        const List = node.ordered ? "ol" : "ul";
        return (
          <List key={key} start={node.ordered ? node.start : undefined}>
            {render(node.children)}
          </List>
        );
      }
      case "listItem":
        return (
          <li key={key}>
            {node.checked !== undefined && (
              <input type="checkbox" checked={node.checked} disabled aria-label={node.checked ? "Done" : "Not done"} />
            )}
            {render(
              node.children.length === 1 && node.children[0].type === "paragraph"
                ? node.children[0].children
                : node.children,
            )}
          </li>
        );
      case "table": {
        const [head, ...rows] = node.children;
        const cells = (row: GuideNode, Cell: "th" | "td") =>
          "children" in row
            ? row.children.map((cell, c) => (
                <Cell key={c} style={{ textAlign: node.align[c] ?? undefined }}>
                  {"children" in cell ? render(cell.children) : null}
                </Cell>
              ))
            : null;
        return (
          <div key={key} className="osc-guide-table">
            <table>
              {head && (
                <thead>
                  <tr>{cells(head, "th")}</tr>
                </thead>
              )}
              <tbody>
                {rows.map((row, r) => (
                  <tr key={r}>{cells(row, "td")}</tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      case "link": {
        const { target } = node;
        if (target.kind === "external")
          return SAFE_URL.test(target.url) ? (
            <a key={key} href={target.url} target="_blank" rel="noopener noreferrer">
              {render(node.children)}
            </a>
          ) : (
            <span key={key}>{render(node.children)}</span>
          );
        const to = { page: target.page, section: target.section };
        return (
          <a
            key={key}
            href={locationHref(to)}
            onClick={(e) => {
              e.preventDefault();
              onNavigate(to);
            }}
          >
            {render(node.children)}
          </a>
        );
      }
    }
  }

  return <>{render(nodes)}</>;
}
