import { Router } from "express";
import type { BaseDeDatos } from "../db.js";
import { requiereAutenticacion } from "../middleware.js";
import { esquemaCrearReserva } from "../validacion.js";
import {
  ErrorReserva,
  cancelarReserva,
  crearReserva,
  crearReservaRecurrente,
  listarReservasDeUsuario,
  registrarCheckin,
} from "../servicios/reservas.js";

const CODIGOS_HTTP: Record<string, number> = {
  espacio_no_encontrado: 404,
  reserva_no_encontrada: 404,
  no_autorizado: 403,
  solape_espacio: 409,
  solape_puesto_usuario: 409,
  sin_ocurrencias: 400,
  fuera_de_ventana_checkin: 409,
};

function responderError(res: import("express").Response, error: unknown) {
  if (error instanceof ErrorReserva) {
    const codigo = CODIGOS_HTTP[error.motivo] ?? 400;
    res.status(codigo).json({ error: error.motivo, detalle: error.detalle });
    return;
  }
  throw error;
}

export function rutasReservas(db: BaseDeDatos): Router {
  const router = Router();
  router.use(requiereAutenticacion(db));

  router.get("/mias", (req, res) => {
    res.json(listarReservasDeUsuario(db, req.usuario!.id, new Date()));
  });

  router.post("/", (req, res) => {
    const datos = esquemaCrearReserva.safeParse(req.body);
    if (!datos.success) {
      res.status(400).json({ error: "datos_invalidos", detalle: datos.error.flatten() });
      return;
    }
    const ahora = new Date();
    try {
      if (datos.data.recurrente) {
        const reservas = crearReservaRecurrente(db, {
          espacioId: datos.data.espacioId,
          usuarioId: req.usuario!.id,
          inicio: new Date(datos.data.inicio),
          fin: new Date(datos.data.fin),
          hasta: new Date(datos.data.recurrente.hasta),
          ahora,
        });
        res.status(201).json({ reservas });
      } else {
        const reserva = crearReserva(db, {
          espacioId: datos.data.espacioId,
          usuarioId: req.usuario!.id,
          inicio: new Date(datos.data.inicio),
          fin: new Date(datos.data.fin),
          ahora,
        });
        res.status(201).json({ reserva });
      }
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post("/:id/checkin", (req, res) => {
    try {
      const reserva = registrarCheckin(db, req.params.id, req.usuario!, new Date());
      res.json(reserva);
    } catch (error) {
      responderError(res, error);
    }
  });

  router.post("/:id/cancelar", (req, res) => {
    const todaLaSerie = req.body?.todaLaSerie === true;
    try {
      const reservas = cancelarReserva(db, req.params.id, req.usuario!, todaLaSerie);
      res.json({ reservas });
    } catch (error) {
      responderError(res, error);
    }
  });

  return router;
}
