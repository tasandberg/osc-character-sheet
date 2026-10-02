type Update = (data: Record<string, unknown>) => unknown;
type Committer = (path: string) => (next: string) => void;

export type Commit = {
  text: Committer;
  number: Committer;
  loose: Committer;
  patch: (data: Record<string, unknown>) => void;
};

const unformatted = (value: string) =>
  /^[+-]?\d{1,3}(,\d{3})+$/.test(value) ? value.replace(/,/g, "") : value;

const asNumber = (value: string) => {
  const n = Number(unformatted(value));
  return value !== "" && Number.isFinite(n) ? n : null;
};

export function makeCommit(update: Update): Commit {
  return {
    text: (path) => (next) => void update({ [path]: next }),
    patch: (data) => void update(data),
    number: (path) => (next) => {
      if (next === "") return void update({ [path]: null });
      const n = asNumber(next);
      if (n != null) void update({ [path]: n });
    },
    loose: (path) => (next) => void update({ [path]: asNumber(next) ?? next }),
  };
}
