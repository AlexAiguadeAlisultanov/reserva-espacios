import { Router } from "express";
import type { BaseDeDatos } from "../db.js";
import { verificarContrasena } from "../auth.js";
import { crearSesion, borrarSesion } from "../sesion.js";
import { esquemaLogin } from "../validacion.js";
import { requiereAutenticacion } from "../middleware.js";
import type { Rol } from "../tipos.js";

export function rutasAuth(db: BaseDeDatos): Router {
  const router = Router();

  router.post("/entrar", async (req, res) => {
    const datos = esquemaLogin.safeParse(req.body);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos" });
      return;
    }
    const fila = db.prepare("SELECT id, email, contrasena_hash, nombre, rol FROM usuarios WHERE email = ?").get(datos.data.email) as unknown as
      | { id: string; email: string; contrasena_hash: string; nombre: string; rol: Rol }
      | undefined;
    if (!fila) {
      res.status(401).json({ error: "credenciales_invalidas" });
      return;
    }
    const valido = await verificarContrasena(datos.data.contrasena, fila.contrasena_hash);
    if (!valido) {
      res.status(401).json({ error: "credenciales_invalidas" });
      return;
    }
    crearSesion(res, fila.id, fila.rol);
    res.json({ id: fila.id, email: fila.email, nombre: fila.nombre, rol: fila.rol });
  });

  router.post("/salir", (_req, res) => {
    borrarSesion(res);
    res.status(204).end();
  });

  router.get("/yo", requiereAutenticacion(db), (req, res) => {
    res.json(req.usuario);
  });

  return router;
}
