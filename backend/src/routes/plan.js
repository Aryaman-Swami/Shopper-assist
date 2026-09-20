import { Router } from "express";
import multer from "multer";
import { extractFromImage, extractFromText } from "../services/extraction.js";
import { filterAvailable } from "../services/inventory.js";
import { matchItems } from "../services/matching.js";
import { buildRoute } from "../services/routing.js";

const upload = multer({ storage: multer.memoryStorage() });
export const router = Router();

router.post("/plan", upload.single("image"), async (req, res, next) => {
  try {
    let extracted;
    if (req.file) {
      extracted = await extractFromImage(req.file.buffer, req.file.mimetype);
    } else if (req.body.text) {
      extracted = await extractFromText(req.body.text);
    } else {
      return res.status(400).json({ detail: "Provide either 'text' or 'image'" });
    }

    const matches = await matchItems(extracted.map((item) => item.name));

    const matchedItems = matches
      .filter((m) => m.match && m.matched)
      .map((m) => ({ sku: m.match.sku, query: m.query }));
    const unmatched = matches.filter((m) => !m.match || !m.matched).map((m) => m.query);

    const filtered = await filterAvailable(matchedItems);
    const itemNodes = filtered.available.map((item) => item.shelf_id);
    const routeData = await buildRoute(itemNodes);

    const itemsByStop = {};
    for (const item of filtered.available) {
      (itemsByStop[item.shelf_id] ??= []).push({ sku: item.sku, name: item.name, query: item.query });
    }

    res.json({
      extracted_items: extracted,
      matches,
      unmatched,
      out_of_stock: filtered.outOfStock,
      route: { ...routeData, items_by_stop: itemsByStop },
    });
  } catch (err) {
    next(err);
  }
});
