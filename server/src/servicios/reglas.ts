import type { BaseDeDatos } from "../db.js";
import type { ReglasOficina } from "../engine/reglas.js";
import { reglasDesdeFila, type FilaReglas } from "./filas.js";

export function obtenerReglas(db: BaseDeDatos): ReglasOficina {
  const fila = db.prepare("SELECT * FROM reglas_oficina WHERE id = 1").get() as unknown as FilaReglas;
  return reglasDesdeFila(fila);
}

export function actualizarReglas(db: BaseDeDatos, cambios: Partial<ReglasOficina>): ReglasOficina {
  const actuales = obtenerReglas(db);
  const nuevas: ReglasOficina = { ...actuales, ...cambios };
  db.prepare(
    `UPDATE reglas_oficina SET antelacion_maxima_dias = ?, duracion_maxima_minutos = ?, duracion_minima_minutos = ?, apertura = ?, cierre = ? WHERE id = 1`
  ).run(nuevas.antelacionMaximaDias, nuevas.duracionMaximaMinutos, nuevas.duracionMinimaMinutos, nuevas.apertura, nuevas.cierre);
  return nuevas;
}
