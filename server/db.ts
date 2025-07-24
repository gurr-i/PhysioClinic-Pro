import * as schema from "@shared/schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Check if we're using a local PostgreSQL connection
const isLocalPostgres = process.env.DATABASE_URL.includes('localhost') ||
                       process.env.DATABASE_URL.includes('127.0.0.1');

let pool: any, db: any;

// Use different database drivers based on connection type
async function initializeDatabase() {
  if (isLocalPostgres) {
    console.log('Using local PostgreSQL connection');
    // Import local PostgreSQL connection
    const localDb = await import('./local-db');
    pool = localDb.pool;
    db = localDb.db;
  } else {
    console.log('Using Neon serverless PostgreSQL connection');
    // Import Neon serverless connection
    const { Pool, neonConfig } = await import('@neondatabase/serverless');
    const { drizzle } = await import('drizzle-orm/neon-serverless');
    const ws = await import('ws');

    neonConfig.webSocketConstructor = ws.default;

    pool = new Pool({ connectionString: process.env.DATABASE_URL });
    db = drizzle({ client: pool, schema });

    // Test the connection
    pool.query('SELECT 1').then(() => {
      console.log('Neon database connection successful');
    }).catch((err: any) => {
      console.error('Neon database connection error:', err);
    });
  }
}

// Initialize the database connection
const dbPromise = initializeDatabase();

export { pool, db, dbPromise };