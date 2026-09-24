import type { NextFunction, Request, Response } from "express";
import type { BaseDeDatos } from "./db.js";
import { leerSesion } from "./sesion.js";
import type { Rol } from "./tipos.js";

export interface UsuarioSesion {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      usuario?: UsuarioSesion;
    }
  }
}

export function requiereAutenticacion(db: BaseDeDatos) {
  return (req: Request, res: Response, next: NextFunction) => {
    const carga = leerSesion(req);
    if (!carga) {
      res.status(401).json({ error: "no_autenticado" });
      return;
    }
    const fila = db.prepare("SELECT id, email, nombre, rol FROM usuarios WHERE id = ?").get(carga.uid) as unknown as
      | { id: string; email: string; nombre: string; rol: Rol }
      | undefined;
    if (!fila) {
      res.status(401).json({ error: "no_autenticado" });
      return;
    }
    req.usuario = fila;
    next();
  };
}

export function requiereAdmin(req: Request, res: Response, next: NextFunction) {
  if (req.usuario?.rol !== "admin") {
    res.status(403).json({ error: "permiso_denegado" });
    return;
  }
  next();
}
