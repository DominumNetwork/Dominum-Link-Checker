import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import https from "https";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.get("/api/proxy", (req, res) => {
    const targetUrl = req.query.url as string;
    
    if (!targetUrl) {
      return res.status(400).json({ error: "Missing url parameter" });
    }

    https.get(targetUrl, (apiRes) => {
      res.status(apiRes.statusCode || 200);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Content-Type', apiRes.headers['content-type'] || 'application/json');

      apiRes.pipe(res);
    }).on('error', (err) => {
      console.error(err);
      res.status(500).json({ error: err.message });
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();