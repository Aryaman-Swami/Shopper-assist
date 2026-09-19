import { Router } from "express";
import { filterAvailable } from "../services/inventory.js";
import { buildRoute } from "../services/routing.js";

export const router = Router();

router.post("/route", async (req, res, next) => {
  try {
    const skus = req.body.skus ?? [];
    const filtered = await filterAvailable(skus);
    const itemNodes = filtered.available.map((item) => item.shelf_id);
    const routeData = await buildRoute(itemNodes);

    const itemsByStop = {};
    for (const item of filtered.available) {
      (itemsByStop[item.shelf_id] ??= []).push({ sku: item.sku, name: item.name });
    }

    res.json({ ...routeData, items_by_stop: itemsByStop, out_of_stock: filtered.outOfStock });
  } catch (err) {
    next(err);
  }
});
