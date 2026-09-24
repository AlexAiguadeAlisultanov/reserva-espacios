import { Router } from "express";
import type { BaseDeDatos } from "../db.js";
import { requiereAutenticacion } from "../middleware.js";
import { esquemaAgenda, esquemaBusqueda, esquemaDisponibilidad } from "../validacion.js";
import { listarEspacios } from "../servicios/espacios.js";
import { agendaDelEspacio, buscarEspaciosDisponibles, planoConEstado } from "../servicios/disponibilidad.js";

export function rutasEspacios(db: BaseDeDatos): Router {
  const router = Router();
  router.use(requiereAutenticacion(db));

  router.get("/", (req, res) => {
    const planta = req.query.planta !== undefined ? Number(req.query.planta) : undefined;
    res.json(listarEspacios(db, { soloActivos: true, planta }));
  });

  router.get("/disponibilidad", (req, res) => {
    const datos = esquemaDisponibilidad.safeParse(req.query);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos" });
      return;
    }
    const inicio = new Date(datos.data.inicio);
    const fin = new Date(datos.data.fin);
    if (fin <= inicio) {
      res.status(400).json({ error: "fin_antes_que_inicio" });
      return;
    }
    res.json(planoConEstado(db, datos.data.planta, inicio, fin));
  });

  router.get("/busqueda", (req, res) => {
    const datos = esquemaBusqueda.safeParse(req.query);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos" });
      return;
    }
    const inicio = new Date(datos.data.inicio);
    const fin = new Date(datos.data.fin);
    if (fin <= inicio) {
      res.status(400).json({ error: "fin_antes_que_inicio" });
      return;
    }
    const resultado = buscarEspaciosDisponibles(db, {
      inicio,
      fin,
      tipo: datos.data.tipo,
      planta: datos.data.planta,
      capacidadMinima: datos.data.capacidadMinima,
      equipamiento: datos.data.equipamiento as ("pantalla" | "videoconferencia" | "pizarra")[],
    });
    res.json(resultado);
  });

  router.get("/agenda", (req, res) => {
    const datos = esquemaAgenda.safeParse(req.query);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos" });
      return;
    }
    res.json(agendaDelEspacio(db, datos.data.espacioId, datos.data.fecha));
  });

  return router;
}
