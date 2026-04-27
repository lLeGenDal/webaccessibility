import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import fetch from "node-fetch";
import https from "https";

// Create a custom agent to allow self-signed certificates or old TLS versions
const agent = new https.Agent({
  rejectUnauthorized: false,
  keepAlive: true,
  family: 4,
  minVersion: 'TLSv1', // Support older governmental sites
  maxVersion: 'TLSv1.3'
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route: Proxy for fetching external site HTML
  app.get("/api/proxy", async (req, res) => {
    const rawUrl = (req.query.url as string || '').trim();
    if (!rawUrl) return res.status(400).json({ error: "URL is required" });

    const tryFetch = async (targetUrl: string): Promise<{ ok: boolean; status?: number; statusText?: string; html?: string; error?: any }> => {
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:124.0) Gecko/20100101 Firefox/124.0'
      ];
      const randomUA = userAgents[Math.floor(Math.random() * userAgents.length)];

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      try {
        const response = await fetch(targetUrl, {
          headers: {
            'User-Agent': randomUA,
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7,kk-KZ;q=0.6',
            'Cache-Control': 'max-age=0',
            'Referer': 'https://www.google.com/',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-User': '?1',
            'DNT': '1'
          },
          agent,
          signal: controller.signal
        });
        clearTimeout(timeout);
        if (!response.ok) return { ok: false, status: response.status, statusText: response.statusText };
        const html = await response.text();
        return { ok: true, html };
      } catch (error) {
        clearTimeout(timeout);
        return { ok: false, error };
      }
    };

    // Prepare variants to try
    let cleanUrl = rawUrl.trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    const variants = [
      rawUrl.trim(),
      `https://${cleanUrl}`,
      `http://${cleanUrl}`,
      `https://www.${cleanUrl.replace(/^www\./, '')}`,
      `http://www.${cleanUrl.replace(/^www\./, '')}`
    ];
    
    // Remove duplicates
    const uniqueVariants = [...new Set(variants)];

    console.log(`Starting proxy attempts for: ${rawUrl}`);
    
    for (const variant of uniqueVariants) {
      console.log(`Trying variant: ${variant}`);
      const result = await tryFetch(variant);
      
      if (result.ok) {
        return res.send(result.html);
      }
      
      // Small pause before next variant
      await new Promise(r => setTimeout(r, 800));
      
      // If result is not ok but we have a status (e.g. 403, 404), maybe we shouldn't retry? 
      // Actually, keep trying other variants unless it's a 404 on a specific variant.
      if (result.status === 404 || result.status === 403) {
        console.log(`Variant ${variant} returned ${result.status}`);
      }
    }

    // If all failed, report the last error or a generic one
    res.status(500).json({ 
      error: "Сайт заблокировал автоматический запрос.",
      details: "Системы ИБ казахстанских госорганов часто блокируют роботов. Пожалуйста, используйте ручной ввод HTML-кода для анализа."
    });
  });

  // Vite middleware for development
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
