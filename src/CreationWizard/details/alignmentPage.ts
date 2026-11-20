import type { Alignment, AlignmentText } from "../rules";

const HEADINGS: Record<Alignment, string> = {
  lawful: "Law",
  neutral: "Neutrality",
  chaotic: "Chaos",
};

export function parseAlignmentPage(html: string): AlignmentText {
  const paragraphs = [
    ...new DOMParser().parseFromString(html, "text/html").querySelectorAll("p"),
  ];
  return Object.fromEntries(
    (Object.entries(HEADINGS) as [Alignment, string][]).flatMap(
      ([alignment, heading]) => {
        const paragraph = paragraphs.find((p) =>
          p.querySelector("strong")?.textContent?.trim().startsWith(heading),
        );
        const text = paragraph?.textContent
          ?.replace(new RegExp(`^\\s*${heading}:?\\s*`), "")
          .trim();
        return text ? [[alignment, text]] : [];
      },
    ),
  );
}
