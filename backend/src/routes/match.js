import { Router } from "express";
import { matchItems } from "../services/matching.js";

export const router = Router();

router.post("/match", async (req, res, next) => {
  try {
    const items = req.body.items ?? [];
    const results = await matchItems(items);
    res.json({ results });
  } catch (err) {
    next(err);
  }
});
