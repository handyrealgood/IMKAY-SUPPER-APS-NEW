import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";

interface DbStore {
  revision: number;
  lastUpdated: string;
  data: Record<string, any>;
}

const PORT = 3000;
const DB_DIR = path.join(process.cwd(), "database");
const DB_FILE = path.join(DB_DIR, "resto_database.json");

// Process safety guards to keep the server running 24/7 in production LAN
process.on("uncaughtException", (err) => {
  console.error("[Server Guard] Uncaught Exception kept alive safely:", err);
});
process.on("unhandledRejection", (reason) => {
  console.error("[Server Guard] Unhandled Rejection kept alive safely:", reason);
});

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

// In-memory database cache backed by JSON file
let serverDb: DbStore = {
  revision: 1,
  lastUpdated: new Date().toISOString(),
  data: {}
};

// Load database from file on boot if exists
try {
  if (fs.existsSync(DB_FILE)) {
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      serverDb = {
        revision: typeof parsed.revision === "number" ? parsed.revision : 1,
        lastUpdated: parsed.lastUpdated || new Date().toISOString(),
        data: parsed.data || parsed // Support direct object or wrapped format
      };
      console.log(`[Database] Loaded existing database from ${DB_FILE} (Revision: ${serverDb.revision}, Keys: ${Object.keys(serverDb.data).length})`);
    }
  } else {
    console.log(`[Database] No existing database file found. Will create ${DB_FILE} on first client sync.`);
  }
} catch (err) {
  console.error("[Database] Error reading database file on startup:", err);
}

// Atomic file writer to avoid corrupted JSON files on sudden power cut
let saveTimeout: NodeJS.Timeout | null = null;
function scheduleSaveToFile() {
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(serverDb, null, 2), "utf-8");
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error("[Database] Failed to write database to disk:", err);
    }
  }, 100); // 100ms debounce
}

// SSE (Server-Sent Events) clients for instant real-time sync across devices
interface SseClient {
  id: string;
  res: express.Response;
}
const sseClients: SseClient[] = [];

function broadcastToClients(event: string, payload: any, senderOriginId?: string) {
  const dataString = `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
  for (let i = sseClients.length - 1; i >= 0; i--) {
    const client = sseClients[i];
    try {
      client.res.write(dataString);
    } catch {
      sseClients.splice(i, 1);
    }
  }
}

async function startServer() {
  const app = express();

  // JSON payload parser with high limit for receipts/orders
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // CORS headers to support cross-device LAN calls smoothly
  app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, X-Client-Id");
    if (req.method === "OPTIONS") {
      res.sendStatus(204);
      return;
    }
    next();
  });

  // Favicon handler: Serve restaurant logo or SVG icon across LAN devices
  app.get("/favicon.ico", (req, res) => {
    try {
      const branding = serverDb.data["resto_branding"];
      if (branding && branding.logoType === "custom_image" && branding.logoUrl) {
        if (branding.logoUrl.startsWith("data:image/")) {
          const parts = branding.logoUrl.split(",");
          const mime = parts[0].match(/:(.*?);/)?.[1] || "image/png";
          const imgBuffer = Buffer.from(parts[1], "base64");
          res.setHeader("Content-Type", mime);
          res.setHeader("Cache-Control", "public, max-age=1800");
          return res.send(imgBuffer);
        } else {
          return res.redirect(branding.logoUrl);
        }
      }

      // Default clean SVG with restaurant initials
      const initials = (branding?.logoInitials || branding?.outletName?.substring(0, 2) || "IK").toUpperCase();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect width="64" height="64" rx="18" fill="#059669"/><rect x="2" y="2" width="60" height="60" rx="16" fill="none" stroke="#ffffff" stroke-opacity="0.25" stroke-width="2"/><text x="32" y="42" font-family="sans-serif" font-size="26" font-weight="900" fill="#ffffff" text-anchor="middle">${initials}</text></svg>`;
      res.setHeader("Content-Type", "image/svg+xml");
      res.setHeader("Cache-Control", "public, max-age=1800");
      res.send(svg);
    } catch {
      res.status(204).end();
    }
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      serverTime: new Date().toISOString(),
      revision: serverDb.revision,
      keys: Object.keys(serverDb.data).length,
      connectedClients: sseClients.length
    });
  });

  // GET complete database state
  app.get("/api/db/state", (req, res) => {
    res.json({
      success: true,
      revision: serverDb.revision,
      lastUpdated: serverDb.lastUpdated,
      data: serverDb.data,
      connectedClients: sseClients.length
    });
  });

  // GET specific database key
  app.get("/api/db/get/:key", (req, res) => {
    const key = req.params.key;
    const value = serverDb.data[key];
    res.json({
      success: true,
      revision: serverDb.revision,
      key,
      data: value !== undefined ? value : null
    });
  });

  // POST sync updates from any client (PC Kasir, Waiter Phone, Kitchen, Manager)
  app.post("/api/db/sync", (req, res) => {
    try {
      const { key, data, updates, originId } = req.body;
      let hasChanges = false;

      if (updates && typeof updates === "object") {
        for (const [k, val] of Object.entries(updates)) {
          serverDb.data[k] = val;
          hasChanges = true;
        }
      } else if (key && data !== undefined) {
        serverDb.data[key] = data;
        hasChanges = true;
      }

      if (hasChanges) {
        serverDb.revision += 1;
        serverDb.lastUpdated = new Date().toISOString();
        scheduleSaveToFile();

        // Broadcast delta to all other devices in LAN
        broadcastToClients("sync", {
          revision: serverDb.revision,
          lastUpdated: serverDb.lastUpdated,
          key: key || null,
          data: data !== undefined ? data : null,
          updates: updates || null,
          originId: originId || null
        }, originId);
      }

      res.json({
        success: true,
        revision: serverDb.revision,
        lastUpdated: serverDb.lastUpdated
      });
    } catch (err: any) {
      console.error("[Database] Error syncing database update:", err);
      res.status(500).json({ success: false, error: err?.message || "Internal server error" });
    }
  });

  // Initial batch upload (seed server from client if server is empty)
  app.post("/api/db/init-batch", (req, res) => {
    try {
      const { data, originId } = req.body;
      if (data && typeof data === "object") {
        let changed = false;
        for (const [key, val] of Object.entries(data)) {
          // If server doesn't have this key yet, accept it from client
          if (serverDb.data[key] === undefined) {
            serverDb.data[key] = val;
            changed = true;
          }
        }
        if (changed) {
          serverDb.revision += 1;
          serverDb.lastUpdated = new Date().toISOString();
          scheduleSaveToFile();
          broadcastToClients("sync-all", {
            revision: serverDb.revision,
            lastUpdated: serverDb.lastUpdated,
            data: serverDb.data,
            originId: originId || null
          }, originId);
        }
      }
      res.json({
        success: true,
        revision: serverDb.revision,
        data: serverDb.data
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message });
    }
  });

  // SSE Real-time events stream
  app.get("/api/db/events", (req, res) => {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache, no-transform");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("X-Accel-Buffering", "no");

    const clientId = `client_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const client: SseClient = { id: clientId, res };
    sseClients.push(client);

    // Initial greeting packet
    res.write(`event: connected\ndata: ${JSON.stringify({
      clientId,
      revision: serverDb.revision,
      lastUpdated: serverDb.lastUpdated,
      connectedClients: sseClients.length
    })}\n\n`);

    // Heartbeat ping every 15s to keep connection alive
    const pingInterval = setInterval(() => {
      try {
        res.write(`event: ping\ndata: ${JSON.stringify({ t: Date.now() })}\n\n`);
      } catch {
        clearInterval(pingInterval);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(pingInterval);
      const index = sseClients.findIndex(c => c.id === clientId);
      if (index !== -1) {
        sseClients.splice(index, 1);
      }
    });
  });

  // Backup download endpoint
  app.get("/api/db/backup", (req, res) => {
    res.setHeader("Content-Disposition", `attachment; filename="imah_kayu_database_backup_${new Date().toISOString().slice(0, 10)}.json"`);
    res.setHeader("Content-Type", "application/json");
    res.send(JSON.stringify(serverDb, null, 2));
  });

  // Full project source code ZIP download endpoint for LAN offline setup
  app.get("/api/download-project-zip", (req, res) => {
    const zipPath = path.join(process.cwd(), "public", "resto-app-complete.zip");
    if (fs.existsSync(zipPath)) {
      res.setHeader("Content-Disposition", 'attachment; filename="resto-app-complete.zip"');
      res.setHeader("Content-Type", "application/zip");
      fs.createReadStream(zipPath).pipe(res);
    } else {
      res.status(404).json({ success: false, message: "ZIP bundle not found" });
    }
  });

  // Restore database endpoint
  app.post("/api/db/restore", (req, res) => {
    try {
      const { backup } = req.body;
      if (!backup || !backup.data) {
        res.status(400).json({ success: false, message: "Invalid backup payload format." });
        return;
      }
      serverDb = {
        revision: (serverDb.revision || 0) + 1,
        lastUpdated: new Date().toISOString(),
        data: backup.data
      };
      scheduleSaveToFile();
      broadcastToClients("sync-all", {
        revision: serverDb.revision,
        lastUpdated: serverDb.lastUpdated,
        data: serverDb.data
      });
      res.json({ success: true, revision: serverDb.revision, message: "Database successfully restored!" });
    } catch (err: any) {
      res.status(500).json({ success: false, message: err?.message });
    }
  });

  // Vite middleware for development
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
    console.log(`=======================================================`);
    console.log(`🍽️  RESTORAN IMAH KAYU - LOCAL LAN DATABASE SERVER`);
    console.log(`➜ Port:           ${PORT} (0.0.0.0:${PORT})`);
    console.log(`➜ Database Path:  ${DB_FILE}`);
    console.log(`➜ Real-Time Sync: ACTIVE (SSE /api/db/events)`);
    console.log(`=======================================================`);
  });
}

startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
