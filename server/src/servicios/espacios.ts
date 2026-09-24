import { randomUUID } from "node:crypto";
import type { BaseDeDatos } from "../db.js";
import type { Espacio, Equipamiento, TipoEspacio } from "../tipos.js";
import { espacioDesdeFila, type FilaEspacio } from "./filas.js";

export function listarEspacios(db: BaseDeDatos, opciones: { soloActivos?: boolean; planta?: number } = {}): Espacio[] {
  const condiciones: string[] = [];
  const parametros: (string | number)[] = [];
  if (opciones.soloActivos) condiciones.push("activo = 1");
  if (opciones.planta !== undefined) {
    condiciones.push("planta = ?");
    parametros.push(opciones.planta);
  }
  const where = condiciones.length ? `WHERE ${condiciones.join(" AND ")}` : "";
  const filas = db.prepare(`SELECT * FROM espacios ${where} ORDER BY planta, tipo, nombre`).all(...parametros) as unknown as FilaEspacio[];
  return filas.map(espacioDesdeFila);
}

export function obtenerEspacio(db: BaseDeDatos, id: string): Espacio | null {
  const fila = db.prepare("SELECT * FROM espacios WHERE id = ?").get(id) as unknown as FilaEspacio | undefined;
  return fila ? espacioDesdeFila(fila) : null;
}

export interface DatosNuevoEspacio {
  tipo: TipoEspacio;
  nombre: string;
  planta: number;
  capacidad: number;
  equipamiento: Equipamiento[];
  posX: number;
  posY: number;
  ancho: number;
  alto: number;
}

export function crearEspacio(db: BaseDeDatos, datos: DatosNuevoEspacio): Espacio {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO espacios (id, tipo, nombre, planta, capacidad, equipamiento, pos_x, pos_y, ancho, alto, activo, bloqueado, motivo_bloqueo)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, NULL)`
  ).run(id, datos.tipo, datos.nombre, datos.planta, datos.capacidad, JSON.stringify(datos.equipamiento), datos.posX, datos.posY, datos.ancho, datos.alto);
  return obtenerEspacio(db, id)!;
}

export interface CambiosEspacio {
  nombre?: string;
  capacidad?: number;
  equipamiento?: Equipamiento[];
  activo?: boolean;
  bloqueado?: boolean;
  motivoBloqueo?: string | null;
  posX?: number;
  posY?: number;
}

export function actualizarEspacio(db: BaseDeDatos, id: string, cambios: CambiosEspacio): Espacio | null {
  const actual = obtenerEspacio(db, id);
  if (!actual) return null;
  const nuevo = {
    nombre: cambios.nombre ?? actual.nombre,
    capacidad: cambios.capacidad ?? actual.capacidad,
    equipamiento: cambios.equipamiento ?? actual.equipamiento,
    activo: cambios.activo ?? actual.activo,
    bloqueado: cambios.bloqueado ?? actual.bloqueado,
    motivoBloqueo: cambios.motivoBloqueo !== undefined ? cambios.motivoBloqueo : actual.motivoBloqueo,
    posX: cambios.posX ?? actual.posX,
    posY: cambios.posY ?? actual.posY,
  };
  db.prepare(
    `UPDATE espacios SET nombre = ?, capacidad = ?, equipamiento = ?, activo = ?, bloqueado = ?, motivo_bloqueo = ?, pos_x = ?, pos_y = ? WHERE id = ?`
  ).run(
    nuevo.nombre,
    nuevo.capacidad,
    JSON.stringify(nuevo.equipamiento),
    nuevo.activo ? 1 : 0,
    nuevo.bloqueado ? 1 : 0,
    nuevo.motivoBloqueo,
    nuevo.posX,
    nuevo.posY,
    id
  );
  return obtenerEspacio(db, id);
}
