import { MongoClient, type Db } from "mongodb";

/**
 * A single cached MongoDB connection, server-only.
 *
 * Next.js dev mode hot-reloads route modules on every edit, which would open a fresh
 * connection every time without this — so the client/promise are stashed on `global`,
 * the same pattern MongoDB's own Next.js integration guide recommends. In production
 * (one long-running Node process per `output: "standalone"`) this is just a module-level
 * singleton.
 */

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || "mitrends";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Set it in .env.local.");
  }
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = new MongoClient(uri).connect();
  }
  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export const MONGODB_CONFIGURED = Boolean(uri);
