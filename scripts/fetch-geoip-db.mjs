
import { mkdir, rename, rm } from "node:fs/promises";
import { createWriteStream } from "node:fs";
import { dirname } from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { createGunzip } from "node:zlib";

const BASE_URL = process.env.GEOIP_DOWNLOAD_BASE ?? "https://download.db-ip.com/free";
const dest = process.argv[2];

if (!dest) {
  console.warn("[geoip] usage: node scripts/fetch-geoip-db.mjs <destination.mmdb>; skipping.");
  process.exit(0);
}

function monthTag(offset) {
  const d = new Date();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() - offset);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

async function tryMonth(month) {
  const url = `${BASE_URL}/dbip-city-lite-${month}.mmdb.gz`;
  const res = await fetch(url);
  if (!res.ok || !res.body) throw new Error(`${url} -> HTTP ${res.status}`);

  const tmp = `${dest}.part`;
  try {
    await pipeline(Readable.fromWeb(res.body), createGunzip(), createWriteStream(tmp));
    await rename(tmp, dest);
  } catch (err) {
    await rm(tmp, { force: true });
    throw err;
  }
}

await mkdir(dirname(dest), { recursive: true });

const errors = [];
for (let offset = 0; offset <= 3; offset++) {
  const month = monthTag(offset);
  try {
    await tryMonth(month);
    console.log(`[geoip] installed ${month} database at ${dest}`);
    process.exit(0);
  } catch (err) {
    errors.push(`${month}: ${err instanceof Error ? err.message : err}`);
  }
}

console.warn(
  `[geoip] WARNING: could not download the DB-IP database; visitor country and city ` +
    `will not be recorded. Build continues.\n  ${errors.join("\n  ")}`,
);
process.exit(0);
