import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureMidiaCatalog } from "./ensureMidiaCatalog";
import { pool } from "./pg-storage";

const app = express();

app.set("trust proxy", 1);

declare module 'http' {
  interface IncomingMessage {
    rawBody: unknown
  }
}
app.use(express.json({
  verify: (req, _res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  await ensureMidiaCatalog();

  // TEMP DIAGNOSTIC (Item 7 - auditoria): verificar se já existem linhas
  // duplicadas (team_id, round_id) na tabela "results" antes de adicionar
  // uma constraint de unicidade. Remover após a checagem.
  try {
    const dup = await pool.query(`
      SELECT team_id, round_id, COUNT(*) AS count
      FROM results
      GROUP BY team_id, round_id
      HAVING COUNT(*) > 1
    `);
    log(`[DIAG-ITEM7] Grupos (team_id, round_id) duplicados em "results": ${dup.rows.length}`);
    if (dup.rows.length > 0) {
      log(`[DIAG-ITEM7] Detalhe: ${JSON.stringify(dup.rows)}`);
    }
    const total = await pool.query(`SELECT COUNT(*) AS count FROM results`);
    log(`[DIAG-ITEM7] Total de linhas em "results": ${total.rows[0].count}`);
  } catch (e) {
    log(`[DIAG-ITEM7] Erro ao checar duplicatas: ${e}`);
  }

  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
