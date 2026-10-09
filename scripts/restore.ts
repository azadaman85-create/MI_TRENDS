/**
 * Restores collections from a backup file produced by scripts/backup.ts.
 *
 *   npx tsx --env-file=.env.local scripts/restore.ts <file> <collection[,collection]> [--replace]
 *
 * Deliberately awkward to use, because a restore overwrites live data:
 *
 *   - You must name the collections. There is no "restore everything" switch.
 *   - By default it only inserts documents whose _id is missing, so a restore can bring
 *     back something deleted without undoing edits made since the backup.
 *   - `--replace` overwrites matching documents too. It still never deletes anything
 *     the backup doesn't contain.
 *
 * Always take a fresh backup before restoring, so the current state is recoverable if
 * the restore turns out to be the wrong call.
 */
import { readFileSync } from "fs";

import { getDb } from "@/lib/db/mongodb";

async function main() {
  const [file, collectionArg, ...flags] = process.argv.slice(2);
  const replace = flags.includes("--replace");

  if (!file || !collectionArg) {
    console.error("Usage: restore.ts <file> <collection[,collection]> [--replace]");
    process.exit(1);
  }

  const parsed = JSON.parse(readFileSync(file, "utf8")) as {
    takenAt: string;
    database: string;
    dump: Record<string, Record<string, unknown>[]>;
  };
  const wanted = collectionArg.split(",").map((name) => name.trim()).filter(Boolean);

  console.log(`  backup taken ${parsed.takenAt} from "${parsed.database}"`);
  console.log(`  mode: ${replace ? "REPLACE existing documents" : "insert missing documents only"}\n`);

  const db = await getDb();
  for (const name of wanted) {
    const docs = parsed.dump[name];
    if (!docs) {
      console.log(`  ${name}: not present in this backup, skipped`);
      continue;
    }
    if (docs.length === 0) {
      console.log(`  ${name}: backup holds 0 documents, skipped`);
      continue;
    }

    const ops = docs.map((doc) => {
      const { _id, ...rest } = doc;
      return replace
        ? { updateOne: { filter: { _id }, update: { $set: rest }, upsert: true } }
        : { updateOne: { filter: { _id }, update: { $setOnInsert: rest }, upsert: true } };
    });
    const result = await db.collection(name).bulkWrite(ops as never[], { ordered: false });
    console.log(`  ${name.padEnd(14)} ${result.upsertedCount} restored, ${result.modifiedCount} overwritten`);
  }

  console.log("\n  done");
  process.exit(0);
}

main().catch((error) => {
  console.error("Restore failed:", error);
  process.exit(1);
});
