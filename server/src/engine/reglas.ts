// Reglas de negocio configurables por el administrador: antelacion maxima,
// duracion maxima y horario de oficina. Funciones puras, sin acceso a base
// de datos, para poder probarlas con casos concretos.

import { diaSemanaLocal, horaLocal } from "./tiempo.js";

export interface ReglasOficina {
  antelacionMaximaDias: number;
  duracionMaximaMinutos: number;
  duracionMinimaMinutos: number;
  apertura: string; // "HH:MM" en Madrid
  cierre: string; // "HH:MM" en Madrid
}

export const REGLAS_POR_DEFECTO: ReglasOficina = {
  antelacionMaximaDias: 30,
  duracionMaximaMinutos: 240,
  duracionMinimaMinutos: 15,
  apertura: "08:00",
  cierre: "19:00",
};

export type MotivoRechazo =
  | "fuera_de_horario"
  | "fin_de_semana"
  | "duracion_invalida"
  | "duracion_excesiva"
  | "demasiada_antelacion"
  | "en_el_pasado"
  | "espacio_bloqueado"
  | "espacio_inactivo";

export interface Resultado {
  valido: boolean;
  motivo?: MotivoRechazo;
}

const OK: Resultado = { valido: true };

/** La oficina abre de lunes a viernes, dentro de la franja horaria configurada. */
export function dentroDeHorarioDeOficina(inicio: Date, fin: Date, reglas: ReglasOficina): Resultado {
  const diaInicio = diaSemanaLocal(inicio);
  const diaFin = diaSemanaLocal(fin);
  if (diaInicio > 5 || diaFin > 5 || diaInicio !== diaFin) {
    return { valido: false, motivo: "fin_de_semana" };
  }
  const horaInicio = horaLocal(inicio);
  const horaFin = horaLocal(fin);
  if (horaInicio < reglas.apertura || horaFin > reglas.cierre) {
    return { valido: false, motivo: "fuera_de_horario" };
  }
  return OK;
}

export function duracionValida(inicio: Date, fin: Date, reglas: ReglasOficina): Resultado {
  const minutos = (fin.getTime() - inicio.getTime()) / 60000;
  if (minutos <= 0 || minutos < reglas.duracionMinimaMinutos) {
    return { valido: false, motivo: "duracion_invalida" };
  }
  if (minutos > reglas.duracionMaximaMinutos) {
    return { valido: false, motivo: "duracion_excesiva" };
  }
  return OK;
}

export function dentroDeAntelacion(inicio: Date, ahora: Date, reglas: ReglasOficina): Resultado {
  if (inicio.getTime() < ahora.getTime()) {
    return { valido: false, motivo: "en_el_pasado" };
  }
  const limiteMs = reglas.antelacionMaximaDias * 24 * 60 * 60 * 1000;
  if (inicio.getTime() - ahora.getTime() > limiteMs) {
    return { valido: false, motivo: "demasiada_antelacion" };
  }
  return OK;
}

export interface EspacioParaValidar {
  activo: boolean;
  bloqueado: boolean;
}

export function espacioDisponibleParaReservar(espacio: EspacioParaValidar): Resultado {
  if (!espacio.activo) return { valido: false, motivo: "espacio_inactivo" };
  if (espacio.bloqueado) return { valido: false, motivo: "espacio_bloqueado" };
  return OK;
}

/** Valida una franja completa contra todas las reglas de negocio, en orden. */
export function validarFranja(
  inicio: Date,
  fin: Date,
  ahora: Date,
  reglas: ReglasOficina,
  espacio: EspacioParaValidar
): Resultado {
  const pasos = [
    () => espacioDisponibleParaReservar(espacio),
    () => duracionValida(inicio, fin, reglas),
    () => dentroDeAntelacion(inicio, ahora, reglas),
    () => dentroDeHorarioDeOficina(inicio, fin, reglas),
  ];
  for (const paso of pasos) {
    const resultado = paso();
    if (!resultado.valido) return resultado;
  }
  return OK;
}
