// El corazon de la aplicacion: crear, cancelar y hacer check-in de reservas.
// Toda creacion pasa por una transaccion que primero libera lo caducado,
// luego valida las reglas de negocio y por ultimo comprueba solapes, tanto
// para una reserva suelta como para cada ocurrencia de una serie recurrente.

import { randomUUID } from "node:crypto";
import { enTransaccion, type BaseDeDatos } from "../db.js";
import { hayConflicto, type Intervalo } from "../engine/solapes.js";
import { validarFranja, type MotivoRechazo } from "../engine/reglas.js";
import { debeLiberarsePorFaltaDeCheckin, puedeHacerCheckin, VENTANA_CHECKIN_MINUTOS } from "../engine/checkin.js";
import { generarOcurrenciasSemanales } from "../engine/recurrencia.js";
import { obtenerReglas } from "./reglas.js";
import { obtenerEspacio } from "./espacios.js";
import { reservaDesdeFila, type FilaReserva } from "./filas.js";
import type { Reserva } from "../tipos.js";

export class ErrorReserva extends Error {
  motivo: MotivoRechazo | "espacio_no_encontrado" | "solape_espacio" | "solape_puesto_usuario" | "sin_ocurrencias" | "reserva_no_encontrada" | "no_autorizado" | "fuera_de_ventana_checkin";
  detalle?: unknown;
  constructor(motivo: ErrorReserva["motivo"], detalle?: unknown) {
    super(motivo);
    this.motivo = motivo;
    this.detalle = detalle;
  }
}

/** Pasa a "no_presentada" cualquier reserva confirmada sin check-in cuya ventana ya paso. Idempotente. */
export function liberarNoPresentadas(db: BaseDeDatos, ahora: Date): void {
  const limite = new Date(ahora.getTime() - VENTANA_CHECKIN_MINUTOS * 60000).toISOString();
  db.prepare(
    `UPDATE reservas SET estado = 'no_presentada' WHERE estado = 'confirmada' AND checkin_en IS NULL AND inicio <= ?`
  ).run(limite);
}

function reservasConfirmadasDeEspacio(db: BaseDeDatos, espacioId: string): Intervalo[] {
  const filas = db
    .prepare(`SELECT inicio, fin FROM reservas WHERE espacio_id = ? AND estado = 'confirmada'`)
    .all(espacioId) as unknown as { inicio: string; fin: string }[];
  return filas.map((f) => ({ inicio: new Date(f.inicio), fin: new Date(f.fin) }));
}

function reservasConfirmadasDePuestosDeUsuario(db: BaseDeDatos, usuarioId: string): Intervalo[] {
  const filas = db
    .prepare(
      `SELECT r.inicio AS inicio, r.fin AS fin FROM reservas r
       JOIN espacios e ON e.id = r.espacio_id
       WHERE r.usuario_id = ? AND e.tipo = 'puesto' AND r.estado = 'confirmada'`
    )
    .all(usuarioId) as unknown as { inicio: string; fin: string }[];
  return filas.map((f) => ({ inicio: new Date(f.inicio), fin: new Date(f.fin) }));
}

function insertarReserva(db: BaseDeDatos, datos: { espacioId: string; usuarioId: string; inicio: Date; fin: Date; recurrenciaId: string | null; ahora: Date }): string {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO reservas (id, espacio_id, usuario_id, inicio, fin, estado, recurrencia_id, checkin_en, creado_en)
     VALUES (?, ?, ?, ?, ?, 'confirmada', ?, NULL, ?)`
  ).run(id, datos.espacioId, datos.usuarioId, datos.inicio.toISOString(), datos.fin.toISOString(), datos.recurrenciaId, datos.ahora.toISOString());
  return id;
}

export interface DatosCrearReserva {
  espacioId: string;
  usuarioId: string;
  inicio: Date;
  fin: Date;
  ahora: Date;
}

/** Crea una reserva suelta. Lanza ErrorReserva si no cumple alguna regla. */
export function crearReserva(db: BaseDeDatos, datos: DatosCrearReserva): Reserva {
  return enTransaccion(db, () => {
    liberarNoPresentadas(db, datos.ahora);

    const espacio = obtenerEspacio(db, datos.espacioId);
    if (!espacio) throw new ErrorReserva("espacio_no_encontrado");

    const reglas = obtenerReglas(db);
    const validacion = validarFranja(datos.inicio, datos.fin, datos.ahora, reglas, espacio);
    if (!validacion.valido) throw new ErrorReserva(validacion.motivo!);

    const nueva = { inicio: datos.inicio, fin: datos.fin };
    if (hayConflicto(reservasConfirmadasDeEspacio(db, datos.espacioId), nueva)) {
      throw new ErrorReserva("solape_espacio");
    }
    if (espacio.tipo === "puesto" && hayConflicto(reservasConfirmadasDePuestosDeUsuario(db, datos.usuarioId), nueva)) {
      throw new ErrorReserva("solape_puesto_usuario");
    }

    const id = insertarReserva(db, { ...datos, recurrenciaId: null });
    return obtenerReserva(db, id)!;
  });
}

export interface DatosCrearReservaRecurrente extends DatosCrearReserva {
  hasta: Date;
}

/** Crea una serie semanal completa o ninguna reserva: si una sola ocurrencia
 * choca con algo, se revierte toda la serie dentro de la misma transaccion. */
export function crearReservaRecurrente(db: BaseDeDatos, datos: DatosCrearReservaRecurrente): Reserva[] {
  return enTransaccion(db, () => {
    liberarNoPresentadas(db, datos.ahora);

    const espacio = obtenerEspacio(db, datos.espacioId);
    if (!espacio) throw new ErrorReserva("espacio_no_encontrado");

    const reglas = obtenerReglas(db);
    const ocurrencias = generarOcurrenciasSemanales(datos.inicio, datos.fin, datos.hasta);
    if (ocurrencias.length === 0) throw new ErrorReserva("sin_ocurrencias");

    const existentesEspacio = reservasConfirmadasDeEspacio(db, datos.espacioId);
    const existentesPuestoUsuario = espacio.tipo === "puesto" ? reservasConfirmadasDePuestosDeUsuario(db, datos.usuarioId) : [];
    const yaValidadas: Intervalo[] = [];

    for (const ocurrencia of ocurrencias) {
      const validacion = validarFranja(ocurrencia.inicio, ocurrencia.fin, datos.ahora, reglas, espacio);
      if (!validacion.valido) {
        throw new ErrorReserva(validacion.motivo!, { fecha: ocurrencia.inicio.toISOString() });
      }
      if (hayConflicto(existentesEspacio, ocurrencia) || hayConflicto(yaValidadas, ocurrencia)) {
        throw new ErrorReserva("solape_espacio", { fecha: ocurrencia.inicio.toISOString() });
      }
      if (espacio.tipo === "puesto" && hayConflicto(existentesPuestoUsuario, ocurrencia)) {
        throw new ErrorReserva("solape_puesto_usuario", { fecha: ocurrencia.inicio.toISOString() });
      }
      yaValidadas.push(ocurrencia);
    }

    const recurrenciaId = randomUUID();
    const ids = ocurrencias.map((ocurrencia) =>
      insertarReserva(db, {
        espacioId: datos.espacioId,
        usuarioId: datos.usuarioId,
        inicio: ocurrencia.inicio,
        fin: ocurrencia.fin,
        recurrenciaId,
        ahora: datos.ahora,
      })
    );
    return ids.map((id) => obtenerReserva(db, id)!);
  });
}

export function obtenerReserva(db: BaseDeDatos, id: string): Reserva | null {
  const fila = db.prepare("SELECT * FROM reservas WHERE id = ?").get(id) as unknown as FilaReserva | undefined;
  return fila ? reservaDesdeFila(fila) : null;
}

export interface UsuarioBasico {
  id: string;
  rol: "empleado" | "admin";
}

/** Cancela una reserva (y, si se pide, toda su serie). Solo el dueno o un admin. */
export function cancelarReserva(db: BaseDeDatos, reservaId: string, usuario: UsuarioBasico, todaLaSerie: boolean): Reserva[] {
  return enTransaccion(db, () => {
    const reserva = obtenerReserva(db, reservaId);
    if (!reserva) throw new ErrorReserva("reserva_no_encontrada");
    if (reserva.usuarioId !== usuario.id && usuario.rol !== "admin") throw new ErrorReserva("no_autorizado");

    if (todaLaSerie && reserva.recurrenciaId) {
      db.prepare(`UPDATE reservas SET estado = 'cancelada' WHERE recurrencia_id = ? AND estado = 'confirmada'`).run(reserva.recurrenciaId);
      const filas = db.prepare(`SELECT * FROM reservas WHERE recurrencia_id = ?`).all(reserva.recurrenciaId) as unknown as FilaReserva[];
      return filas.map(reservaDesdeFila);
    }

    db.prepare(`UPDATE reservas SET estado = 'cancelada' WHERE id = ?`).run(reservaId);
    return [obtenerReserva(db, reservaId)!];
  });
}

export function registrarCheckin(db: BaseDeDatos, reservaId: string, usuario: UsuarioBasico, ahora: Date): Reserva {
  return enTransaccion(db, () => {
    liberarNoPresentadas(db, ahora);
    const reserva = obtenerReserva(db, reservaId);
    if (!reserva) throw new ErrorReserva("reserva_no_encontrada");
    if (reserva.usuarioId !== usuario.id && usuario.rol !== "admin") throw new ErrorReserva("no_autorizado");

    const paraValidar = {
      estado: reserva.estado,
      inicio: new Date(reserva.inicio),
      fin: new Date(reserva.fin),
      checkinEn: reserva.checkinEn ? new Date(reserva.checkinEn) : null,
    };
    if (!puedeHacerCheckin(paraValidar, ahora)) throw new ErrorReserva("fuera_de_ventana_checkin");

    db.prepare(`UPDATE reservas SET checkin_en = ? WHERE id = ?`).run(ahora.toISOString(), reservaId);
    return obtenerReserva(db, reservaId)!;
  });
}

export interface ReservaConEspacio extends Reserva {
  espacioNombre: string;
  espacioTipo: "sala" | "puesto";
  planta: number;
  puedeHacerCheckin: boolean;
}

export function listarReservasDeUsuario(db: BaseDeDatos, usuarioId: string, ahora: Date): ReservaConEspacio[] {
  liberarNoPresentadas(db, ahora);
  const filas = db
    .prepare(
      `SELECT r.*, e.nombre AS espacio_nombre, e.tipo AS espacio_tipo, e.planta AS planta
       FROM reservas r JOIN espacios e ON e.id = r.espacio_id
       WHERE r.usuario_id = ? ORDER BY r.inicio DESC`
    )
    .all(usuarioId) as unknown as (FilaReserva & { espacio_nombre: string; espacio_tipo: "sala" | "puesto"; planta: number })[];

  return filas.map((f) => {
    const reserva = reservaDesdeFila(f);
    const paraValidar = {
      estado: reserva.estado,
      inicio: new Date(reserva.inicio),
      fin: new Date(reserva.fin),
      checkinEn: reserva.checkinEn ? new Date(reserva.checkinEn) : null,
    };
    return {
      ...reserva,
      espacioNombre: f.espacio_nombre,
      espacioTipo: f.espacio_tipo,
      planta: f.planta,
      puedeHacerCheckin: puedeHacerCheckin(paraValidar, ahora),
    };
  });
}

export { debeLiberarsePorFaltaDeCheckin };
