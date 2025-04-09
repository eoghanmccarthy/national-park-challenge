import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';
import * as schema from '@shared/schema';

// Create the connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL not set in environment");
}

// Create a postgres connection with pg
const client = postgres(connectionString as string);
// Create a SQL client for direct queries
export const sql = client;
// Create a drizzle instance using the client and schema
export const db = drizzle(client, { schema });

// Function to initialize the database schema
export async function initDb() {
  try {
    console.log("Initializing database schema...");
    
    // We have to check if connectionString is defined again here
    if (!connectionString) {
      throw new Error("DATABASE_URL not set in environment");
    }
    
    // Create a migrator instance
    const migrationClient = postgres(connectionString, { max: 1 });
    
    // Execute the SQL directly to create the tables if they don't exist
    try {
      // Create the parks table
      await migrationClient`
        CREATE TABLE IF NOT EXISTS parks (
          id INTEGER PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT NOT NULL,
          state TEXT NOT NULL,
          year_established INTEGER NOT NULL,
          rating INTEGER NOT NULL DEFAULT 1500,
          park_type TEXT NOT NULL,
          image_url TEXT
        );
      `;
      
      // Create the votes table
      await migrationClient`
        CREATE TABLE IF NOT EXISTS votes (
          id SERIAL PRIMARY KEY,
          winner_id INTEGER NOT NULL REFERENCES parks(id),
          loser_id INTEGER NOT NULL REFERENCES parks(id),
          winner_prev_rating INTEGER NOT NULL,
          loser_prev_rating INTEGER NOT NULL,
          winner_new_rating INTEGER NOT NULL,
          loser_new_rating INTEGER NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      // Create the park_rankings table
      await migrationClient`
        CREATE TABLE IF NOT EXISTS park_rankings (
          id SERIAL PRIMARY KEY,
          park_id INTEGER NOT NULL REFERENCES parks(id),
          position INTEGER NOT NULL,
          rating INTEGER NOT NULL,
          previous_position INTEGER,
          snapshot_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
        );
      `;
      
      console.log("Database schema initialized!");
    } catch (sqlError) {
      console.error("Error executing SQL statements:", sqlError);
      throw sqlError;
    } finally {
      // Close the migration client
      await migrationClient.end();
    }
  } catch (err) {
    console.error("Error initializing database schema:", err);
    throw err;
  }
}