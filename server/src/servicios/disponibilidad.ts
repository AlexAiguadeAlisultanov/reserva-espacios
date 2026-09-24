// Consultas de lectura para el plano, la busqueda y la agenda. Todas liberan
// primero las reservas caducadas sin check-in, para que nadie vea ocupado un
// espacio que en realidad ya quedo libre.

import type { BaseDeDatos } from "../db.js";
import { hayConflicto, type Intervalo } from "../engine/solapes.js";
import { aInstante, fechaLocal, horaLocal } from "../engine/tiempo.js";
import { obtenerReglas } from "./reglas.js";
import { listarEspacios } from "./espacios.js";
import { liberarNoPresentadas } from "./reservas.js";
import type { Espacio, Equipamiento, TipoEspacio } from "../tipos.js";

interface ReservaBreve {
  espacioId: string;
  inicio: Date;
  fin: Date;
  usuarioNombre: string;
}

function reservasConfirmadasEnRango(db: BaseDeDatos, planta: number | undefined, inicio: Date, fin: Date): ReservaBreve[] {
  const condicionPlanta = planta !== undefined ? "AND e.planta = ?" : "";
  const parametros: unknown[] = [inicio.toISOString(), fin.toISOString()];
  if (planta !== undefined) parametros.push(planta);
  const filas = db
    .prepare(
      `SELECT r.espacio_id AS espacio_id, r.inicio AS inicio, r.fin AS fin, u.nombre AS usuario_nombre
       FROM reservas r
       JOIN espacios e ON e.id = r.espacio_id
       JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.estado = 'confirmada' AND r.inicio < ? AND r.fin > ? ${condicionPlanta}`
    )
    .all(fin.toISOString(), inicio.toISOString(), ...(planta !== undefined ? [planta] : [])) as unknown as {
    espacio_id: string;
    inicio: string;
    fin: string;
    usuario_nombre: string;
  }[];
  return filas.map((f) => ({
    espacioId: f.espacio_id,
    inicio: new Date(f.inicio),
    fin: new Date(f.fin),
    usuarioNombre: f.usuario_nombre,
  }));
}

export type EstadoEspacio = "libre" | "ocupado" | "bloqueado" | "inactivo";

export interface EspacioConEstado extends Espacio {
  estado: EstadoEspacio;
  ocupadoPor?: string;
  ocupadoHasta?: string;
}

export function planoConEstado(db: BaseDeDatos, planta: number | undefined, inicio: Date, fin: Date): EspacioConEstado[] {
  liberarNoPresentadas(db, new Date());
  const espacios = listarEspacios(db, { planta });
  const reservas = reservasConfirmadasEnRango(db, planta, inicio, fin);

  return espacios.map((espacio) => {
    if (!espacio.activo) return { ...espacio, estado: "inactivo" as const };
    if (espacio.bloqueado) return { ...espacio, estado: "bloqueado" as const };
    const ocupante = reservas.find((r) => r.espacioId === espacio.id);
    if (ocupante) {
      return { ...espacio, estado: "ocupado" as const, ocupadoPor: ocupante.usuarioNombre, ocupadoHasta: ocupante.fin.toISOString() };
    }
    return { ...espacio, estado: "libre" as const };
  });
}

export interface FiltrosBusqueda {
  inicio: Date;
  fin: Date;
  tipo?: TipoEspacio;
  planta?: number;
  capacidadMinima?: number;
  equipamiento?: Equipamiento[];
}

export function buscarEspaciosDisponibles(db: BaseDeDatos, filtros: FiltrosBusqueda): Espacio[] {
  liberarNoPresentadas(db, new Date());
  const espacios = listarEspacios(db, { soloActivos: true, planta: filtros.planta }).filter((e) => !e.bloqueado);
  const reservas = reservasConfirmadasEnRango(db, filtros.planta, filtros.inicio, filtros.fin);
  const nuevo: Intervalo = { inicio: filtros.inicio, fin: filtros.fin };

  return espacios.filter((espacio) => {
    if (filtros.tipo && espacio.tipo !== filtros.tipo) return false;
    if (filtros.capacidadMinima && espacio.capacidad < filtros.capacidadMinima) return false;
    if (filtros.equipamiento?.length) {
      const tiene = filtros.equipamiento.every((eq) => espacio.equipamiento.includes(eq));
      if (!tiene) return false;
    }
    const ocupado = hayConflicto(
      reservas.filter((r) => r.espacioId === espacio.id).map((r) => ({ inicio: r.inicio, fin: r.fin })),
      nuevo
    );
    return !ocupado;
  });
}

export interface FranjaAgenda {
  inicio: string;
  fin: string;
  estado: "libre" | "ocupado";
  reservaId?: string;
  usuarioNombre?: string;
}

const DURACION_FRANJA_MINUTOS = 30;

export function agendaDelEspacio(db: BaseDeDatos, espacioId: string, fechaYYYYMMDD: string): FranjaAgenda[] {
  liberarNoPresentadas(db, new Date());
  const reglas = obtenerReglas(db);
  const inicioDia = aInstante(`${fechaYYYYMMDD}T${reglas.apertura}:00`);
  const finDia = aInstante(`${fechaYYYYMMDD}T${reglas.cierre}:00`);

  const filas = db
    .prepare(
      `SELECT r.id AS id, r.inicio AS inicio, r.fin AS fin, u.nombre AS usuario_nombre
       FROM reservas r JOIN usuarios u ON u.id = r.usuario_id
       WHERE r.espacio_id = ? AND r.estado = 'confirmada' AND r.inicio < ? AND r.fin > ?
       ORDER BY r.inicio`
    )
    .all(espacioId, finDia.toISOString(), inicioDia.toISOString()) as unknown as { id: string; inicio: string; fin: string; usuario_nombre: string }[];

  const franjas: FranjaAgenda[] = [];
  let cursor = inicioDia;
  while (cursor < finDia) {
    const finFranja = new Date(cursor.getTime() + DURACION_FRANJA_MINUTOS * 60000);
    const ocupante = filas.find((f) => new Date(f.inicio) < finFranja && new Date(f.fin) > cursor);
    franjas.push({
      inicio: cursor.toISOString(),
      fin: finFranja.toISOString(),
      estado: ocupante ? "ocupado" : "libre",
      reservaId: ocupante?.id,
      usuarioNombre: ocupante?.usuario_nombre,
    });
    cursor = finFranja;
  }
  return franjas;
}

export { horaLocal, fechaLocal };
