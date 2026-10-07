# Migrations

MI Trends Core manages its own schema; there is nothing to run by hand.

| Version | File | What it does |
|---|---|---|
| 1.0.0 | [`001_create_mi_tables.sql`](001_create_mi_tables.sql) | Creates `wp_mi_subscribers` and `wp_mi_stock_movements` |

**How it works**

- `MI_CORE_DB_VERSION` (in `mi-trends-core.php`) is the schema version the code expects.
- The option `mi_core_db_version` is the version installed in the database.
- On activation, and on every load where they differ, `MI_Core_Schema::install()` runs
  WordPress's `dbDelta()`, which creates missing tables and adds missing columns/indexes
  without touching data.

**Adding a migration**

1. Change the `CREATE TABLE` statements in `plugins/mi-trends-core/database/class-mi-core-schema.php`.
2. Bump `MI_CORE_DB_VERSION`.
3. Add `00N_description.sql` here documenting the change, and update `../schema/custom-tables.sql`.
4. For data changes dbDelta can't express (renames, backfills), add a step in
   `MI_Core_Schema::maybe_upgrade()` keyed on the old version.

**Data migration from the Next.js app** — the original had no database (localStorage and
generated demo data). The real catalogue is imported from `../seed/` — see
[MIGRATION-GUIDE.md](../../MIGRATION-GUIDE.md).
