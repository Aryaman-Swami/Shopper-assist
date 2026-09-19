import { Router } from "express";
import { matchItem } from "../services/matching.js";

export const router = Router();

router.post("/match", async (req, res, next) => {
  try {
    const items = req.body.items ?? [];
    const results = await Promise.all(items.map((item) => matchItem(item)));
    res.json({ results });
  } catch (err) {
    next(err);
  }
});
