// Capa de acceso a SQLite con node:sqlite (nativo de Node 24, sin dependencias
// que compilar). Un unico fichero define el esquema; todo lo demas son
// sentencias preparadas para no concatenar nunca SQL con datos de entrada.

import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import type { DatabaseSync as DatabaseSyncType } from "node:sqlite";

// Se carga con require en lugar de un `import` estatico porque node:sqlite
// solo existe con el prefijo "node:" (no como "sqlite" a secas), y algunas
// herramientas de build reescriben el especificador quitando ese prefijo.
// Con require, que no reescriben, se evita el problema por completo.
const requerir = createRequire(import.meta.url);
const { DatabaseSync } = requerir("node:sqlite") as { DatabaseSync: typeof DatabaseSyncType };

export type BaseDeDatos = DatabaseSyncType;

export function abrirBaseDeDatos(ruta: string): BaseDeDatos {
  if (ruta !== ":memory:") {
    const carpeta = path.dirname(ruta);
    if (!existsSync(carpeta)) mkdirSync(carpeta, { recursive: true });
  }
  const db = new DatabaseSync(ruta);
  db.exec("PRAGMA foreign_keys = ON");
  if (ruta !== ":memory:") db.exec("PRAGMA journal_mode = WAL");
  return db;
}

export function crearEsquema(db: BaseDeDatos): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      contrasena_hash TEXT NOT NULL,
      nombre TEXT NOT NULL,
      rol TEXT NOT NULL CHECK (rol IN ('empleado','admin')),
      creado_en TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS espacios (
      id TEXT PRIMARY KEY,
      tipo TEXT NOT NULL CHECK (tipo IN ('sala','puesto')),
      nombre TEXT NOT NULL,
      planta INTEGER NOT NULL,
      capacidad INTEGER NOT NULL,
      equipamiento TEXT NOT NULL DEFAULT '[]',
      pos_x REAL NOT NULL,
      pos_y REAL NOT NULL,
      ancho REAL NOT NULL,
      alto REAL NOT NULL,
      activo INTEGER NOT NULL DEFAULT 1,
      bloqueado INTEGER NOT NULL DEFAULT 0,
      motivo_bloqueo TEXT
    );

    CREATE TABLE IF NOT EXISTS reservas (
      id TEXT PRIMARY KEY,
      espacio_id TEXT NOT NULL REFERENCES espacios(id),
      usuario_id TEXT NOT NULL REFERENCES usuarios(id),
      inicio TEXT NOT NULL,
      fin TEXT NOT NULL,
      estado TEXT NOT NULL CHECK (estado IN ('confirmada','cancelada','no_presentada')),
      recurrencia_id TEXT,
      checkin_en TEXT,
      creado_en TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_reservas_espacio ON reservas(espacio_id, inicio, fin);
    CREATE INDEX IF NOT EXISTS idx_reservas_usuario ON reservas(usuario_id, inicio);
    CREATE INDEX IF NOT EXISTS idx_reservas_recurrencia ON reservas(recurrencia_id);

    CREATE TABLE IF NOT EXISTS reglas_oficina (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      antelacion_maxima_dias INTEGER NOT NULL,
      duracion_maxima_minutos INTEGER NOT NULL,
      duracion_minima_minutos INTEGER NOT NULL,
      apertura TEXT NOT NULL,
      cierre TEXT NOT NULL
    );
  `);

  const hayReglas = db.prepare("SELECT COUNT(*) AS n FROM reglas_oficina").get() as unknown as { n: number };
  if (hayReglas.n === 0) {
    db.prepare(
      `INSERT INTO reglas_oficina (id, antelacion_maxima_dias, duracion_maxima_minutos, duracion_minima_minutos, apertura, cierre)
       VALUES (1, 30, 240, 15, '08:00', '19:00')`
    ).run();
  }
}

export function baseDeDatosVacia(db: BaseDeDatos): boolean {
  const fila = db.prepare("SELECT COUNT(*) AS n FROM usuarios").get() as unknown as { n: number };
  return fila.n === 0;
}

/** Ejecuta `fn` dentro de una transaccion inmediata: si lanza, se revierte todo. */
export function enTransaccion<T>(db: BaseDeDatos, fn: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const resultado = fn();
    db.exec("COMMIT");
    return resultado;
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}
