import cors from "cors";
import express from "express";
import { GeminiNotConfigured } from "./errors.js";
import { router as extractRouter } from "./routes/extract.js";
import { router as matchRouter } from "./routes/match.js";
import { router as planRouter } from "./routes/plan.js";
import { router as routeRouter } from "./routes/route.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use(extractRouter);
app.use(matchRouter);
app.use(routeRouter);
app.use(planRouter);

app.use((err, req, res, next) => {
  if (err instanceof GeminiNotConfigured) {
    return res.status(503).json({ detail: err.message });
  }
  console.error(err);
  res.status(500).json({ detail: "Internal Server Error" });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT, () => console.log(`Shopper Assist API listening on :${PORT}`));
