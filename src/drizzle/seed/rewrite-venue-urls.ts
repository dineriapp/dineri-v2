import "dotenv/config";
import { Pool } from "pg";

const platform = (process.env.NEXT_PUBLIC_BETTER_AUTH_URL ?? "").replace(/\/+$/, "");
const venue = (process.env.NEXT_PUBLIC_VENUE_SITE_URL ?? "").replace(/\/+$/, "");

if (!platform || !venue) {
  console.error("Both NEXT_PUBLIC_BETTER_AUTH_URL and NEXT_PUBLIC_VENUE_SITE_URL must be set.");
  process.exit(1);
}

const OLD_PREFIX = `${platform}/r/`;
const NEW_PREFIX = `${venue}/`;
const apply = process.argv.includes("--apply");

const TARGETS: Array<{ table: string; column: string }> = [
  { table: "popups", column: "cta_url" },
  { table: "qr_codes", column: "target_url" },
  { table: "restaurant_links", column: "url" },
];

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });

  try {
    console.log(`${apply ? "APPLYING" : "DRY RUN"}: ${OLD_PREFIX}... -> ${NEW_PREFIX}...\n`);

    for (const { table, column } of TARGETS) {
      const { rows } = await pool.query<{ id: string; value: string }>(
        `select id, ${column} as value from ${table} where ${column} like $1`,
        [`${OLD_PREFIX}%`],
      );

      console.log(`${table}.${column}: ${rows.length} row(s)`);
      for (const r of rows) {
        console.log(`  ${r.value}\n    -> ${r.value.replace(OLD_PREFIX, NEW_PREFIX)}`);
      }

      if (apply && rows.length > 0) {
        const res = await pool.query(
          `update ${table} set ${column} = replace(${column}, $1, $2) where ${column} like $3`,
          [OLD_PREFIX, NEW_PREFIX, `${OLD_PREFIX}%`],
        );
        console.log(`  updated ${res.rowCount}`);
      }
    }

    if (!apply) console.log("\nNothing written. Re-run with --apply to update these rows.");
  } finally {
    await pool.end();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
