import { pool } from "../db.js";

// items: array of SKU strings, or { sku, query } objects when the caller
// has an original shopping-list query worth carrying through to the
// response (so e.g. "Out of stock: Buttermilk" can also say it was matched
// from the user's "milk" — without this, out-of-stock/available entries
// only ever show the resolved product name, disconnected from what the
// user actually typed).
export async function filterAvailable(items) {
  const normalized = items.map((item) => (typeof item === "string" ? { sku: item, query: undefined } : item));
  if (normalized.length === 0) return { available: [], outOfStock: [] };

  const { rows } = await pool.query(
    `SELECT p.sku, p.name, p.aisle_id, p.shelf_id, i.stock_qty
     FROM products p
     JOIN inventory i ON i.sku = p.sku
     WHERE p.sku = ANY($1)`,
    [normalized.map((i) => i.sku)]
  );

  const bySku = new Map(rows.map((r) => [r.sku, r]));
  const available = [];
  const outOfStock = [];
  for (const { sku, query } of normalized) {
    const row = bySku.get(sku);
    if (!row) {
      outOfStock.push({ sku, query, reason: "not_found" });
    } else if (row.stock_qty <= 0) {
      outOfStock.push({ sku, query, name: row.name, reason: "out_of_stock" });
    } else {
      available.push({ ...row, query });
    }
  }
  return { available, outOfStock };
}
