type Update = (data: Record<string, unknown>) => unknown;
type Committer = (path: string) => (next: string) => void;

export type Commit = { text: Committer; number: Committer; loose: Committer };

const isNumeric = (value: string) =>
  value !== "" && Number.isFinite(Number(value));

export function makeCommit(update: Update): Commit {
  return {
    text: (path) => (next) => void update({ [path]: next }),
    number: (path) => (next) => {
      if (next === "") return void update({ [path]: null });
      if (isNumeric(next)) void update({ [path]: Number(next) });
    },
    loose: (path) => (next) =>
      void update({ [path]: isNumeric(next) ? Number(next) : next }),
  };
}
