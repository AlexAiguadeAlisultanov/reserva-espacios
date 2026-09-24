// Conversion entre las filas de SQLite (snake_case, tipos primitivos) y los
// objetos tipados que usa el resto del servidor (camelCase).

import type { Espacio, Reserva } from "../tipos.js";
import type { ReglasOficina } from "../engine/reglas.js";

export interface FilaEspacio {
  id: string;
  tipo: "sala" | "puesto";
  nombre: string;
  planta: number;
  capacidad: number;
  equipamiento: string;
  pos_x: number;
  pos_y: number;
  ancho: number;
  alto: number;
  activo: number;
  bloqueado: number;
  motivo_bloqueo: string | null;
}

export function espacioDesdeFila(f: FilaEspacio): Espacio {
  return {
    id: f.id,
    tipo: f.tipo,
    nombre: f.nombre,
    planta: f.planta,
    capacidad: f.capacidad,
    equipamiento: JSON.parse(f.equipamiento),
    posX: f.pos_x,
    posY: f.pos_y,
    ancho: f.ancho,
    alto: f.alto,
    activo: f.activo === 1,
    bloqueado: f.bloqueado === 1,
    motivoBloqueo: f.motivo_bloqueo,
  };
}

export interface FilaReserva {
  id: string;
  espacio_id: string;
  usuario_id: string;
  inicio: string;
  fin: string;
  estado: "confirmada" | "cancelada" | "no_presentada";
  recurrencia_id: string | null;
  checkin_en: string | null;
  creado_en: string;
}

export function reservaDesdeFila(f: FilaReserva): Reserva {
  return {
    id: f.id,
    espacioId: f.espacio_id,
    usuarioId: f.usuario_id,
    inicio: f.inicio,
    fin: f.fin,
    estado: f.estado,
    recurrenciaId: f.recurrencia_id,
    checkinEn: f.checkin_en,
    creadoEn: f.creado_en,
  };
}

export interface FilaReglas {
  antelacion_maxima_dias: number;
  duracion_maxima_minutos: number;
  duracion_minima_minutos: number;
  apertura: string;
  cierre: string;
}

export function reglasDesdeFila(f: FilaReglas): ReglasOficina {
  return {
    antelacionMaximaDias: f.antelacion_maxima_dias,
    duracionMaximaMinutos: f.duracion_maxima_minutos,
    duracionMinimaMinutos: f.duracion_minima_minutos,
    apertura: f.apertura,
    cierre: f.cierre,
  };
}
