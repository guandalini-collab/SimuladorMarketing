import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { ensureMidiaCatalog } from "./ensureMidiaCatalog";
import { ensureResultsUniqueIndex } from "./ensureResultsUniqueIndex";
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
  await ensureResultsUniqueIndex();

  // TEMP DIAGNOSTIC (Item 7 - auditoria): confirmar que a constraint única
  // "results_unique_team_round" está presente em produção (criada aqui em
  // ensureResultsUniqueIndex, já que o pre-deploy "drizzle-kit push" do
  // Railway está falhando por um erro pré-existente e não relacionado em
  // outra tabela, e por isso não chega a aplicar essa migração sozinho).
  // Remover após a checagem.
  try {
    const idx = await pool.query(`
      SELECT indexname, indexdef FROM pg_indexes
      WHERE tablename = 'results' AND indexname = 'results_unique_team_round'
    `);
    log(`[DIAG-ITEM7] Índice único "results_unique_team_round" presente: ${idx.rows.length > 0}`);
    if (idx.rows.length > 0) {
      log(`[DIAG-ITEM7] Definição: ${idx.rows[0].indexdef}`);
    }
  } catch (e) {
    log(`[DIAG-ITEM7] Erro ao checar índice: ${e}`);
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
