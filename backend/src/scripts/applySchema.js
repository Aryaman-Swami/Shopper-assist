// One-time setup: applies data/schema.sql to the database in DATABASE_URL.
// Usage: node src/scripts/applySchema.js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pool } from "../db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const schemaPath = path.resolve(__dirname, "../../../data/schema.sql");

const sql = fs.readFileSync(schemaPath, "utf8");
await pool.query(sql);
await pool.end();
console.log("Schema applied.");
