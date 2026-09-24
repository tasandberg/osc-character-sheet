import net from "node:net";

const BASE = 30010;
const RANGE = 400;

const name = process.argv[2] ?? "";
let hash = 5381;
for (const ch of name) hash = ((hash * 33) ^ ch.charCodeAt(0)) >>> 0;

const isFree = (port) =>
  new Promise((resolve) => {
    const server = net.createServer();
    server.once("error", () => resolve(false));
    server.once("listening", () => server.close(() => resolve(true)));
    server.listen(port);
  });

const start = hash % RANGE;
for (let offset = 0; offset < RANGE; offset++) {
  const port = BASE + ((start + offset) % RANGE);
  if (await isFree(port)) {
    process.stdout.write(String(port));
    process.exit(0);
  }
}

process.stderr.write(`no free port in ${BASE}-${BASE + RANGE - 1}\n`);
process.exit(1);
