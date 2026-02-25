import express from "express";

const app = express();
const port = process.env.PORT || 3000;

app.get("/health", (_req, res) => {
  res.json({ ok: true, service: "api" });
});

app.listen(port, () => {
  console.log(`API server listening on port ${port}`);
});
