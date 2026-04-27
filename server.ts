import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import Database from "better-sqlite3";
import cors from "cors";
import fetch from "node-fetch";
import https from "https";

const app = express();
const PORT = 3000;

// Create an agent that ignores SSL certificate errors
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

// Initialize SQLite database
const db = new Database("data.db");

// ... (rest of table creation)

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS sites (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    url TEXT NOT NULL,
    category TEXT NOT NULL,
    region TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    lastItaIndex REAL,
    lastInternalScore INTEGER
  );

  CREATE TABLE IF NOT EXISTS audits (
    id TEXT PRIMARY KEY,
    siteId TEXT NOT NULL,
    date TEXT NOT NULL,
    internalScore INTEGER NOT NULL,
    axeScore INTEGER NOT NULL,
    aiScore INTEGER NOT NULL,
    lighthouseScore INTEGER NOT NULL,
    contrastScore INTEGER NOT NULL,
    itaIndex REAL NOT NULL,
    maturityLevel TEXT NOT NULL,
    pourScores TEXT NOT NULL, -- JSON
    manualReviewCompleted INTEGER NOT NULL, -- 0 or 1
    region TEXT NOT NULL,
    wcagBreakdown TEXT NOT NULL, -- JSON
    aiInsights TEXT, -- JSON
    summary TEXT NOT NULL,
    wcagVersion TEXT NOT NULL,
    ownerId TEXT NOT NULL,
    FOREIGN KEY(siteId) REFERENCES sites(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    auditId TEXT NOT NULL,
    criterion TEXT NOT NULL,
    wcagLevel TEXT NOT NULL,
    principle TEXT,
    severity TEXT NOT NULL,
    description TEXT NOT NULL,
    recommendation TEXT NOT NULL,
    element TEXT,
    engine TEXT NOT NULL,
    status TEXT NOT NULL,
    source TEXT NOT NULL,
    comment TEXT,
    helpUrl TEXT,
    FOREIGN KEY(auditId) REFERENCES audits(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS user_profiles (
    uid TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    displayName TEXT NOT NULL,
    role TEXT NOT NULL
  );
`);

app.use(cors());
app.use(express.json());

app.get("/api/proxy", async (req, res) => {
  try {
    const targetUrl = req.query.url as string;
    if (!targetUrl) return res.status(400).json({ error: "Missing URL parameter" });

    const response = await fetch(targetUrl, {
      agent: targetUrl.startsWith("https") ? httpsAgent : undefined,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36"
      }
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Target responded with ${response.status}` });
    }

    const html = await response.text();
    res.send(html);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// API Routes
app.get("/api/sites", (req, res) => {
  try {
    const ownerId = req.headers["x-user-id"] as string;
    const sites = db.prepare("SELECT * FROM sites").all();
    res.json(sites);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/sites", (req, res) => {
  try {
    const site = req.body;
    const stmt = db.prepare(`
      INSERT INTO sites (id, name, url, category, region, createdAt, ownerId, lastItaIndex, lastInternalScore)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name=excluded.name,
        url=excluded.url,
        category=excluded.category,
        region=excluded.region,
        lastItaIndex=excluded.lastItaIndex,
        lastInternalScore=excluded.lastInternalScore
    `);
    stmt.run(site.id, site.name, site.url, site.category, site.region, site.createdAt, site.ownerId, site.lastItaIndex || null, site.lastInternalScore || null);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/sites/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM sites WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/audits", (req, res) => {
  try {
    const audits = db.prepare("SELECT * FROM audits ORDER BY date DESC").all();
    const formatted = audits.map((a: any) => ({
      ...a,
      manualReviewCompleted: !!a.manualReviewCompleted,
      pourScores: JSON.parse(a.pourScores),
      wcagBreakdown: JSON.parse(a.wcagBreakdown),
      aiInsights: a.aiInsights ? JSON.parse(a.aiInsights) : undefined
    }));
    res.json(formatted);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/audits/:id", (req, res) => {
  try {
    const audit = db.prepare("SELECT * FROM audits WHERE id = ?").get(req.params.id) as any;
    if (!audit) return res.status(404).json({ error: "Audit not found" });
    
    res.json({
      ...audit,
      manualReviewCompleted: !!audit.manualReviewCompleted,
      pourScores: JSON.parse(audit.pourScores),
      wcagBreakdown: JSON.parse(audit.wcagBreakdown),
      aiInsights: audit.aiInsights ? JSON.parse(audit.aiInsights) : undefined
    });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/audits", (req, res) => {
  try {
    const { id, siteId, date, internalScore, axeScore, aiScore, lighthouseScore, contrastScore, itaIndex, maturityLevel, pourScores, manualReviewCompleted, region, wcagBreakdown, aiInsights, summary, wcagVersion, ownerId } = req.body;
    
    const stmt = db.prepare(`
      INSERT INTO audits (
        id, siteId, date, internalScore, axeScore, aiScore, lighthouseScore, contrastScore, 
        itaIndex, maturityLevel, pourScores, manualReviewCompleted, region, 
        wcagBreakdown, aiInsights, summary, wcagVersion, ownerId
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        manualReviewCompleted=excluded.manualReviewCompleted,
        itaIndex=excluded.itaIndex,
        maturityLevel=excluded.maturityLevel,
        pourScores=excluded.pourScores,
        wcagBreakdown=excluded.wcagBreakdown,
        aiInsights=excluded.aiInsights,
        summary=excluded.summary
    `);
    
    stmt.run(
      id, siteId, date, internalScore, axeScore, aiScore, lighthouseScore, contrastScore,
      itaIndex, maturityLevel, JSON.stringify(pourScores), manualReviewCompleted ? 1 : 0, region,
      JSON.stringify(wcagBreakdown), JSON.stringify(aiInsights), summary, wcagVersion, ownerId
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error("API Error [POST /api/audits]:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.get("/api/issues/:auditId", (req, res) => {
  try {
    const issues = db.prepare("SELECT * FROM issues WHERE auditId = ?").all(req.params.auditId);
    res.json(issues);
  } catch (error) {
    console.error("API Error [GET /api/issues]:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.post("/api/issues/batch", (req, res) => {
  const transaction = db.transaction((issues: any[]) => {
    const stmt = db.prepare(`
      INSERT INTO issues (id, auditId, criterion, wcagLevel, principle, severity, description, recommendation, element, engine, status, source, comment, helpUrl)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        status=excluded.status,
        comment=excluded.comment
    `);
    for (const issue of issues) {
      stmt.run(
        issue.id, 
        issue.auditId, 
        issue.criterion || "Unknown", 
        issue.wcagLevel || "A", 
        issue.principle || "Universal", 
        issue.severity || "Medium", 
        issue.description || "No description provided", 
        issue.recommendation || "No recommendation provided", 
        issue.element || null, 
        issue.engine || "Manual", 
        issue.status || "Pending", 
        issue.source || "Unknown", 
        issue.comment || null, 
        issue.helpUrl || null
      );
    }
  });

  try {
    transaction(req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("API Error [POST /api/issues/batch]:", error);
    res.status(500).json({ error: (error as Error).message });
  }
});

app.delete("/api/audits/:id", (req, res) => {
  try {
    db.prepare("DELETE FROM audits WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// Vite Middleware
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
