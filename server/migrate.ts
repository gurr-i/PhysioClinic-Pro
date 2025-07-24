import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from '../shared/schema';
import { exec } from 'child_process';
import { promisify } from 'util';
import dotenv from 'dotenv';

console.log('========== MIGRATION SCRIPT STARTED ==========');
console.log('Current directory:', process.cwd());
console.log('Node version:', process.version);

// Load environment variables
dotenv.config();

const execAsync = promisify(exec);

// Configure neon for WebSocket support
neonConfig.webSocketConstructor = ws;

async function createDatabaseIfNotExists() {
  console.log('createDatabaseIfNotExists function called');
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is not set');
  }

  const databaseUrl = process.env.DATABASE_URL;
  // Mask the password in the DATABASE_URL for logging
  const maskedUrl = databaseUrl.replace(/:[^:]*@/, ':****@');
  console.log(`Using DATABASE_URL: ${maskedUrl}`);
  
  // Check if we're using a local PostgreSQL connection
  const isLocalPostgres = databaseUrl.includes('localhost') || databaseUrl.includes('127.0.0.1');
  
  try {
    // Connect directly to the database specified in the URL
    console.log('Attempting to connect to database...');
    let pool;
    
    if (isLocalPostgres) {
      // For local PostgreSQL, use the pg package directly
      console.log('Using local PostgreSQL connection');
      const { Pool: PgPool } = await import('pg');
      pool = new PgPool({ connectionString: databaseUrl });
    } else {
      // For Neon serverless, use WebSocket support
      console.log('Using Neon serverless PostgreSQL connection');
      neonConfig.webSocketConstructor = ws;
      pool = new Pool({ connectionString: databaseUrl });
    }
    
    try {
      // Test the connection
      console.log('Testing database connection...');
      if (isLocalPostgres) {
        await (pool as any).query('SELECT 1');
      } else {
        await (pool as any).query('SELECT 1');
      }
      console.log('Database connection successful');
    } catch (error) {
      console.error('Database connection error:', error);
      console.log('Please ensure the database exists');
      return false;
    } finally {
      await pool.end();
    }
    
    // Now connect to the actual database and run migrations
console.log('Creating drizzle instance...');
let db;
if (isLocalPostgres) {
  const { Pool: PgPool } = await import('pg');
  const { drizzle: pgDrizzle } = await import('drizzle-orm/node-postgres');
  const pgPool = new PgPool({ connectionString: databaseUrl });
  db = pgDrizzle(pgPool, { schema });
} else {
  db = drizzle({ client: new Pool({ connectionString: databaseUrl }), schema });
}
    
    // Generate migrations using drizzle-kit
    console.log('Generating migrations...');
    try {
      console.log('Executing: npx drizzle-kit generate:pg');
      await execAsync('npx drizzle-kit generate:pg');
      console.log('Migrations generated successfully.');
    } catch (error) {
      console.error('Error generating migrations:', error);
      console.error('Error details:', error instanceof Error ? error.message : String(error));
    }
    
    // Apply migrations
console.log('Applying migrations...');
try {
  console.log('Migration folder path: ./migrations');
  console.log('Available schema tables:', Object.keys(schema).join(', '));
  
  if (isLocalPostgres) {
    const { migrate: pgMigrate } = await import('drizzle-orm/node-postgres/migrator');
    await pgMigrate(db, { migrationsFolder: './migrations' });
  } else {
    await migrate(db, { migrationsFolder: './migrations' });
  }
  
  console.log('Migrations applied successfully.');
      
      // Verify tables were created
let verifyPool: any;
if (isLocalPostgres) {
  const { Pool: PgPool } = await import('pg');
  verifyPool = new PgPool({ connectionString: databaseUrl });
} else {
  verifyPool = new Pool({ connectionString: databaseUrl });
}
const tables = await verifyPool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
console.log('Tables in database:', tables.rows.map((row: any) => row.table_name).join(', '));
await verifyPool.end();
    } catch (error) {
      console.error('Error applying migrations:', error);
      console.error('Error stack:', error instanceof Error ? error.stack : String(error));
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Error creating database or applying migrations:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : String(error));
    return false;
  }
}

// Run the function if this file is executed directly
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const isMainModule = process.argv[1] && (process.argv[1] === __filename || process.argv[1].endsWith('migrate.ts'));
console.log('Is main module:', isMainModule);
console.log('Process argv:', process.argv);
console.log('__filename:', __filename);

if (isMainModule) {
  console.log('Running createDatabaseIfNotExists as main module');
  createDatabaseIfNotExists()
    .then((result) => {
      console.log('Database initialization completed:', result);
    })
    .catch((error) => {
      console.error('Database initialization failed:', error);
      process.exit(1);
    });
} else {
  console.log('Not running as main module, skipping database initialization');
}

export { createDatabaseIfNotExists };