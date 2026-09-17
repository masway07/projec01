import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;
const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'app_database.json');
const LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let dbVersion = Date.now();

// Helper to read JSON safely
function readJsonFile(filePath: string, fallback: any = null) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
  }
  return fallback;
}

// Helper to write JSON safely
function writeJsonFile(filePath: string, data: any) {
  try {
    const tempFile = `${filePath}.tmp`;
    fs.writeFileSync(tempFile, JSON.stringify(data, null, 2), 'utf8');
    fs.renameSync(tempFile, filePath);
    return true;
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
    return false;
  }
}

async function startServer() {
  const app = express();

  // Middleware for JSON parsing with 50mb limit for backup/imports
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // CORS headers for local/cross-device access
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // 1. Health check
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      version: dbVersion
    });
  });

  // 2. Sync Status endpoint
  app.get('/api/sync-status', (req, res) => {
    const db = readJsonFile(DB_FILE, null);
    const logs = readJsonFile(LOGS_FILE, []);
    res.json({
      success: true,
      version: dbVersion,
      serverTime: new Date().toISOString(),
      itemsCount: Array.isArray(db?.deptPlanningItems) ? db.deptPlanningItems.length : 0,
      realizationsCount: Array.isArray(db?.realizations) ? db.realizations.length : 0,
      logsCount: Array.isArray(logs) ? logs.length : 0
    });
  });

  // 3. Get Full Application State
  app.get('/api/app-data', (req, res) => {
    const db = readJsonFile(DB_FILE, null);
    const logs = readJsonFile(LOGS_FILE, []);
    res.json({
      success: true,
      data: db,
      auditLogs: logs,
      version: dbVersion,
      serverTime: new Date().toISOString()
    });
  });

  // 4. Save/Update Application State (Sync from Desktop or Mobile)
  app.post('/api/app-data', (req, res) => {
    try {
      const incomingData = req.body;
      if (!incomingData || typeof incomingData !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid payload' });
      }

      // If client sent auditLogs separately or inside state, handle them
      if (Array.isArray(incomingData.auditLogs)) {
        const existingLogs = readJsonFile(LOGS_FILE, []);
        const logsMap = new Map();
        [...existingLogs, ...incomingData.auditLogs].forEach(l => {
          if (l && l.id) logsMap.set(l.id, l);
        });
        const mergedLogs = Array.from(logsMap.values()).sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        writeJsonFile(LOGS_FILE, mergedLogs.slice(0, 5000)); // retain last 5000 logs
      }

      // Save database file
      const stateToSave = { ...incomingData };
      delete stateToSave.auditLogs; // keep logs in their dedicated file

      writeJsonFile(DB_FILE, stateToSave);
      dbVersion = Date.now();

      res.json({
        success: true,
        version: dbVersion,
        savedAt: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('Error saving app-data:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. Get Audit Logs
  app.get('/api/audit-logs', (req, res) => {
    const logs = readJsonFile(LOGS_FILE, []);
    res.json({
      success: true,
      data: logs,
      count: logs.length,
      serverTime: new Date().toISOString()
    });
  });

  // 6. Record New Audit Log(s)
  app.post('/api/audit-logs', (req, res) => {
    try {
      const payload = req.body;
      const incomingLogs = Array.isArray(payload) ? payload : [payload];
      const validLogs = incomingLogs.filter(l => l && typeof l === 'object');

      if (validLogs.length === 0) {
        return res.status(400).json({ success: false, error: 'No logs provided' });
      }

      const existingLogs = readJsonFile(LOGS_FILE, []);
      const logsMap = new Map();
      [...validLogs, ...existingLogs].forEach(l => {
        if (l && l.id) logsMap.set(l.id, l);
      });

      const mergedLogs = Array.from(logsMap.values()).sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      writeJsonFile(LOGS_FILE, mergedLogs.slice(0, 5000));

      res.json({
        success: true,
        recorded: validLogs.length,
        total: mergedLogs.length
      });
    } catch (err: any) {
      console.error('Error writing audit logs:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 7. Clear Audit Logs (Admin only action)
  app.delete('/api/audit-logs', (req, res) => {
    try {
      writeJsonFile(LOGS_FILE, []);
      res.json({ success: true, message: 'Audit logs cleared' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Vite Middleware in Dev or Static File Serving in Prod
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SmartBudget] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
