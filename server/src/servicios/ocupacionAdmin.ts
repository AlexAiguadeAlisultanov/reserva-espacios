// Panel de ocupacion del administrador: porcentaje de uso por espacio y por
// dia de la semana, mas el recuento de reservas no presentadas.

import type { BaseDeDatos } from "../db.js";
import { diaSemanaLocal } from "../engine/tiempo.js";
import { minutosPorDiaSemana, minutosReservados, porcentajeOcupacion, contarNoPresentadas, type ReservaOcupacion } from "../engine/ocupacion.js";
import { obtenerReglas } from "./reglas.js";
import { listarEspacios } from "./espacios.js";
import { liberarNoPresentadas } from "./reservas.js";

function minutosHorarioPorDia(apertura: string, cierre: string): number {
  const [hA = 0, mA = 0] = apertura.split(":").map(Number);
  const [hC = 0, mC = 0] = cierre.split(":").map(Number);
  return hC * 60 + mC - (hA * 60 + mA);
}

export interface OcupacionPorEspacio {
  espacioId: string;
  nombre: string;
  tipo: "sala" | "puesto";
  porcentaje: number;
  noPresentadas: number;
}

export interface PanelOcupacion {
  porEspacio: OcupacionPorEspacio[];
  porDiaSemana: { dia: number; porcentaje: number }[];
  totalNoPresentadas: number;
}

export function calcularPanelOcupacion(db: BaseDeDatos, desde: Date, hasta: Date): PanelOcupacion {
  liberarNoPresentadas(db, new Date());
  const reglas = obtenerReglas(db);
  const espacios = listarEspacios(db, { soloActivos: true });
  const diasLaborables = contarDiasLaborables(desde, hasta);
  const minutosDisponiblesPorEspacio = diasLaborables * minutosHorarioPorDia(reglas.apertura, reglas.cierre);

  const filas = db
    .prepare(
      `SELECT espacio_id AS espacioId, inicio, fin, estado FROM reservas
       WHERE inicio < ? AND fin > ?`
    )
    .all(hasta.toISOString(), desde.toISOString()) as unknown as { espacioId: string; inicio: string; fin: string; estado: ReservaOcupacion["estado"] }[];

  const reservas: ReservaOcupacion[] = filas.map((f) => ({
    espacioId: f.espacioId,
    inicio: new Date(f.inicio),
    fin: new Date(f.fin),
    estado: f.estado,
  }));

  const porEspacio: OcupacionPorEspacio[] = espacios.map((espacio) => {
    const reservasDelEspacio = reservas.filter((r) => r.espacioId === espacio.id);
    const minutos = minutosReservados(reservasDelEspacio);
    return {
      espacioId: espacio.id,
      nombre: espacio.nombre,
      tipo: espacio.tipo,
      porcentaje: porcentajeOcupacion(minutos, minutosDisponiblesPorEspacio),
      noPresentadas: contarNoPresentadas(reservasDelEspacio),
    };
  });

  const minutosPorDia = minutosPorDiaSemana(reservas, diaSemanaLocal);
  const minutosDisponiblesPorDia = (minutosHorarioPorDia(reglas.apertura, reglas.cierre) * espacios.length * diasLaborables) / 5 || 1;
  const porDiaSemana = [1, 2, 3, 4, 5].map((dia) => ({
    dia,
    porcentaje: porcentajeOcupacion(minutosPorDia[dia] ?? 0, minutosDisponiblesPorDia),
  }));

  return {
    porEspacio,
    porDiaSemana,
    totalNoPresentadas: reservas.filter((r) => r.estado === "no_presentada").length,
  };
}

function contarDiasLaborables(desde: Date, hasta: Date): number {
  let cuenta = 0;
  const cursor = new Date(desde);
  while (cursor <= hasta) {
    const dia = diaSemanaLocal(cursor);
    if (dia <= 5) cuenta++;
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return Math.max(1, cuenta);
}
