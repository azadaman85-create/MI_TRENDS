/**
 * Dumps every collection to a timestamped JSON file.
 *
 *   npx tsx --env-file=.env.local scripts/backup.ts [outputDir]
 *
 * Atlas keeps its own snapshots, but those are restored through the Atlas UI and roll
 * the whole cluster back. This is the other half: a plain file you hold, that can be
 * inspected, diffed, and restored one collection at a time — which is what you actually
 * want after a bad bulk edit in the panel.
 *
 * Product image bytes live in `productImages` and are included, so a restore brings the
 * pictures back too. That makes the file large; it is the price of it being complete.
 *
 * The file contains customer emails and password hashes. Treat it as sensitive: keep it
 * out of the repo (scripts/backups/ is gitignored) and off shared drives.
 */
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

import { getDb } from "@/lib/db/mongodb";

const COLLECTIONS = ["products", "productImages", "orders", "customers", "banners", "categories", "reviews", "coupons"];

async function main() {
  const outDir = process.argv[2] ?? join(process.cwd(), "scripts", "backups");
  mkdirSync(outDir, { recursive: true });

  const db = await getDb();
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dump: Record<string, unknown[]> = {};
  let total = 0;

  for (const name of COLLECTIONS) {
    const docs = await db.collection(name).find({}).toArray();
    dump[name] = docs;
    total += docs.length;
    console.log(`  ${name.padEnd(14)} ${docs.length} documents`);
  }

  const file = join(outDir, `mitrends-${stamp}.json`);
  writeFileSync(file, JSON.stringify({ takenAt: new Date().toISOString(), database: db.databaseName, dump }, null, 2));
  console.log(`\n  ${total} documents -> ${file}`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Backup failed:", error);
  process.exit(1);
});
