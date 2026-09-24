// Genera las ocurrencias semanales de una reserva recurrente, conservando la
// hora de pared local en Madrid aunque el rango cruce un cambio de horario.

import { fechaLocal, sumarSemanasConservandoHoraLocal } from "./tiempo.js";
import type { Intervalo } from "./solapes.js";

const MAXIMO_OCURRENCIAS = 104; // dos anos de margen, para no generar sin limite por error

/** El limite "hasta" se trata como una fecha (no un instante exacto): se
 * incluye esa jornada entera, sea cual sea la hora del dia de cada ocurrencia. */
export function generarOcurrenciasSemanales(inicio: Date, fin: Date, hastaFechaLocalIncl: Date): Intervalo[] {
  const fechaLimite = fechaLocal(hastaFechaLocalIncl);
  const ocurrencias: Intervalo[] = [];
  for (let semana = 0; semana < MAXIMO_OCURRENCIAS; semana++) {
    const inicioOcurrencia = semana === 0 ? inicio : sumarSemanasConservandoHoraLocal(inicio, semana);
    const finOcurrencia = semana === 0 ? fin : sumarSemanasConservandoHoraLocal(fin, semana);
    if (fechaLocal(inicioOcurrencia) > fechaLimite) break;
    ocurrencias.push({ inicio: inicioOcurrencia, fin: finOcurrencia });
  }
  return ocurrencias;
}
