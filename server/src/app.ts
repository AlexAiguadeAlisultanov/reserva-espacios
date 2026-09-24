import express, { type Express } from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { BaseDeDatos } from "./db.js";
import { rutasAuth } from "./rutas/auth.js";
import { rutasEspacios } from "./rutas/espacios.js";
import { rutasReservas } from "./rutas/reservas.js";
import { rutasAdmin } from "./rutas/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function crearApp(db: BaseDeDatos): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json());

  app.use("/api/auth", rutasAuth(db));
  app.use("/api/espacios", rutasEspacios(db));
  app.use("/api/reservas", rutasReservas(db));
  app.use("/api/admin", rutasAdmin(db));

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(error);
    res.status(500).json({ error: "error_interno" });
  });

  const carpetaEstatica = path.join(__dirname, "..", "public");
  app.use(express.static(carpetaEstatica));
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(carpetaEstatica, "index.html"));
  });

  return app;
}
