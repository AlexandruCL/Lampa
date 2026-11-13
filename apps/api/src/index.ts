import cors from "cors";
import express from "express";

const app = express();
app.use(cors({ origin: process.env.WEB_ORIGIN }));
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`api listening on ${port}`));
