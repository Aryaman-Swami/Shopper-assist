import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, "../../.env") });

// Supabase terminates TLS with a chain Node's default root store doesn't
// fully verify under the driver's strict "sslmode=require" handling, so we
// set ssl explicitly here instead: encrypted in transit, without full-chain
// verification (the standard, documented way to connect node-postgres to
// Supabase — see https://supabase.com/docs/guides/database/connecting-to-postgres).
export const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});
