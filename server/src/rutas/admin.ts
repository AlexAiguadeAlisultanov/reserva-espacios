import { Router } from "express";
import type { BaseDeDatos } from "../db.js";
import { requiereAdmin, requiereAutenticacion } from "../middleware.js";
import { esquemaActualizarEspacio, esquemaActualizarReglas, esquemaCrearEspacio, esquemaOcupacion } from "../validacion.js";
import { actualizarEspacio, crearEspacio, listarEspacios } from "../servicios/espacios.js";
import { actualizarReglas, obtenerReglas } from "../servicios/reglas.js";
import { calcularPanelOcupacion } from "../servicios/ocupacionAdmin.js";
import { aInstante } from "../engine/tiempo.js";

export function rutasAdmin(db: BaseDeDatos): Router {
  const router = Router();
  router.use(requiereAutenticacion(db), requiereAdmin);

  router.get("/espacios", (_req, res) => {
    res.json(listarEspacios(db));
  });

  router.post("/espacios", (req, res) => {
    const datos = esquemaCrearEspacio.safeParse(req.body);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos", detalle: datos.error.flatten() });
      return;
    }
    res.status(201).json(crearEspacio(db, datos.data));
  });

  router.patch("/espacios/:id", (req, res) => {
    const datos = esquemaActualizarEspacio.safeParse(req.body);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos", detalle: datos.error.flatten() });
      return;
    }
    const espacio = actualizarEspacio(db, req.params.id, datos.data);
    if (!espacio) {
      res.status(404).json({ error: "espacio_no_encontrado" });
      return;
    }
    res.json(espacio);
  });

  router.delete("/espacios/:id", (req, res) => {
    const espacio = actualizarEspacio(db, req.params.id, { activo: false });
    if (!espacio) {
      res.status(404).json({ error: "espacio_no_encontrado" });
      return;
    }
    res.status(204).end();
  });

  router.get("/reglas", (_req, res) => {
    res.json(obtenerReglas(db));
  });

  router.patch("/reglas", (req, res) => {
    const datos = esquemaActualizarReglas.safeParse(req.body);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos", detalle: datos.error.flatten() });
      return;
    }
    res.json(actualizarReglas(db, datos.data));
  });

  router.get("/ocupacion", (req, res) => {
    const datos = esquemaOcupacion.safeParse(req.query);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos" });
      return;
    }
    const desde = aInstante(`${datos.data.desde}T00:00:00`);
    const hasta = aInstante(`${datos.data.hasta}T23:59:59`);
    res.json(calcularPanelOcupacion(db, desde, hasta));
  });

  return router;
}
