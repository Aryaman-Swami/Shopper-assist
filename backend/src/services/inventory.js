import { pool } from "../db.js";

export async function filterAvailable(skus) {
  if (skus.length === 0) return { available: [], outOfStock: [] };

  const { rows } = await pool.query(
    `SELECT p.sku, p.name, p.aisle_id, p.shelf_id, i.stock_qty
     FROM products p
     JOIN inventory i ON i.sku = p.sku
     WHERE p.sku = ANY($1)`,
    [skus]
  );

  const bySku = new Map(rows.map((r) => [r.sku, r]));
  const available = [];
  const outOfStock = [];
  for (const sku of skus) {
    const row = bySku.get(sku);
    if (!row) {
      outOfStock.push({ sku, reason: "not_found" });
    } else if (row.stock_qty <= 0) {
      outOfStock.push({ sku, name: row.name, reason: "out_of_stock" });
    } else {
      available.push(row);
    }
  }
  return { available, outOfStock };
}
