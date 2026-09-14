import "dotenv/config";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { Pool } from "pg";

const MIGRATIONS_DIR = path.join(process.cwd(), "src", "drizzle", "migrations");
const SCHEMA = "drizzle";
const TABLE = "__drizzle_migrations";

type JournalEntry = { idx: number; when: number; tag: string };

function readJournal(): JournalEntry[] {
  const journalPath = path.join(MIGRATIONS_DIR, "meta", "_journal.json");
  if (!fs.existsSync(journalPath)) {
    throw new Error(`No journal at ${journalPath}. Run "pnpm db:generate" first.`);
  }
  const journal = JSON.parse(fs.readFileSync(journalPath, "utf8")) as { entries: JournalEntry[] };
  if (!journal.entries?.length) throw new Error("Journal has no entries.");
  return journal.entries;
}

function hashOf(tag: string): string {
  const file = path.join(MIGRATIONS_DIR, `${tag}.sql`);
  if (!fs.existsSync(file)) throw new Error(`Journal names ${tag} but ${file} is missing.`);
  return crypto.createHash("sha256").update(fs.readFileSync(file).toString()).digest("hex");
}

async function main() {
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is not set.");

  const entries = readJournal();
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const client = await pool.connect();

  try {
    const { rows: existing } = await client.query<{ n: string }>(
      `select count(*)::text as n from information_schema.tables
       where table_schema = 'public' and table_type = 'BASE TABLE'`,
    );
    const tableCount = Number(existing[0].n);
    if (tableCount === 0) {
      console.error(
        "This database is empty - nothing to baseline.\n" +
          'Run "pnpm db:migrate" instead, which will create the schema properly.',
      );
      process.exitCode = 1;
      return;
    }
    console.log(`Found ${tableCount} existing tables in "public".`);

    await client.query("begin");
    await client.query(`create schema if not exists "${SCHEMA}"`);
    await client.query(
      `create table if not exists "${SCHEMA}"."${TABLE}" (
         id serial primary key,
         hash text not null,
         created_at bigint
       )`,
    );

    const { rows: already } = await client.query<{ n: string }>(
      `select count(*)::text as n from "${SCHEMA}"."${TABLE}"`,
    );
    if (Number(already[0].n) > 0) {
      await client.query("rollback");
      console.log(
        `Already baselined - ${already[0].n} migration(s) recorded. Nothing to do.\n` +
          'Use "pnpm db:migrate" to apply anything new.',
      );
      return;
    }

    for (const entry of entries) {
      const hash = hashOf(entry.tag);
      await client.query(
        `insert into "${SCHEMA}"."${TABLE}" ("hash", "created_at") values ($1, $2)`,
        [hash, entry.when],
      );
      console.log(`  recorded ${entry.tag}  ${hash.slice(0, 12)}…`);
    }

    await client.query("commit");
    console.log(
      `\nBaselined ${entries.length} migration(s). "pnpm db:migrate" will now apply only new ones.`,
    );
  } catch (error) {
    await client.query("rollback").catch(() => {});
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error("Baseline failed:", error instanceof Error ? error.message : error);
  process.exit(1);
});
