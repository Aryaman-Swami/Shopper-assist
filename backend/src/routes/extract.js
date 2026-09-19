import { Router } from "express";
import multer from "multer";
import { extractFromImage, extractFromText } from "../services/extraction.js";

const upload = multer({ storage: multer.memoryStorage() });
export const router = Router();

router.post("/extract", upload.single("image"), async (req, res, next) => {
  try {
    let items;
    if (req.file) {
      items = await extractFromImage(req.file.buffer, req.file.mimetype);
    } else if (req.body.text) {
      items = await extractFromText(req.body.text);
    } else {
      return res.status(400).json({ detail: "Provide either 'text' or 'image'" });
    }
    res.json({ items });
  } catch (err) {
    next(err);
  }
});
