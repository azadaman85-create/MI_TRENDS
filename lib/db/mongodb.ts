import { MongoClient, type Db } from "mongodb";

/**
 * A single cached MongoDB connection, server-only.
 *
 * Next.js dev mode hot-reloads route modules on every edit, which would open a fresh
 * connection every time without this — so the client promise is stashed on `global`,
 * the same pattern MongoDB's own Next.js guide recommends. In production it's a
 * module-level singleton reused across requests on the same instance.
 */

const dbName = process.env.MONGODB_DB_NAME || "mitrends";

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

function getClientPromise(): Promise<MongoClient> {
  // Read at call time, not module load: a route module can be evaluated before the
  // environment is fully populated, and reading late also means a corrected env var
  // takes effect without needing a cold start.
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error("MONGODB_URI is not configured. Set it in .env.local (and in the hosting provider's environment variables).");
  }

  if (!global._mongoClientPromise) {
    const promise = new MongoClient(uri, {
      // Fail fast rather than letting a serverless invocation hang until its own
      // timeout — a dead connection should surface as an error we can log.
      serverSelectionTimeoutMS: 8000,
    }).connect();

    // Critical: if the connection fails, drop the cached promise. Caching a rejected
    // promise would make every later request reuse that same failure, turning a
    // transient outage (or a since-fixed misconfiguration) into a permanent one until
    // the process restarts.
    global._mongoClientPromise = promise.catch((error) => {
      global._mongoClientPromise = undefined;
      throw error;
    });
  }

  return global._mongoClientPromise;
}

export async function getDb(): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

export const MONGODB_CONFIGURED = Boolean(process.env.MONGODB_URI);
