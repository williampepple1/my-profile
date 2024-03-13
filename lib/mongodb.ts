import { MongoClient, Db } from 'mongodb';

declare global {
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

interface MongoConnection {
  client: MongoClient;
  db: Db; 
}


const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

// Initialize `cached` as undefined or with the structure expected by `MongoConnection`
let cached: MongoConnection | undefined = global._mongoClientPromise ? { client: new MongoClient(uri), db: new MongoClient(uri).db(dbName) } : undefined;


if (!uri) throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
if (!dbName) throw new Error('Please define the MONGODB_DB environment variable inside .env.local');

if (process.env.NODE_ENV === 'development') {
  if (!global._mongoClientPromise) {
    const client = new MongoClient(uri);
    global._mongoClientPromise = client.connect();
  }
  // Ensure `cached` is initialized correctly when in development mode
  if (!cached) {
    const client = await global._mongoClientPromise;
    cached = { client, db: client.db(dbName) };
  }
} else {
  // For production, always create a new connection
  const client = new MongoClient(uri);
  cached = { client, db: client.db(dbName) };
}

async function connectToDatabase(): Promise<MongoConnection> {
  if (cached?.client && cached?.db) {
    return cached;
  }

  const client = await (global._mongoClientPromise || new MongoClient(uri).connect());
  const db = client.db(dbName);

  cached = { client, db };

  return { client, db };
}

export default connectToDatabase;
