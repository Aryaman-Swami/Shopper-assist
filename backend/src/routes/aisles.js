import { Router } from "express";
import { pool } from "../db.js";

export const router = Router();

router.get("/aisles", async (req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT aisle_id, category, array_agg(name ORDER BY name) AS items
       FROM products
       GROUP BY aisle_id, category
       ORDER BY aisle_id`
    );
    res.json({ aisles: rows });
  } catch (err) {
    next(err);
  }
});
