// Siembra la base de datos con la oficina de ejemplo. Se llama sola al
// arrancar si la base esta vacia, y tambien se puede invocar a mano con
// `npm run db:sembrar`.

import { randomUUID } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { abrirBaseDeDatos, crearEsquema, type BaseDeDatos } from "./db.js";
import { hashearContrasena } from "./auth.js";
import { aInstante } from "./engine/tiempo.js";
import { espaciosSemilla, reservasSemilla, usuariosSemilla } from "./datosEjemplo.js";

export async function sembrar(db: BaseDeDatos): Promise<void> {
  const idsUsuarios = new Map<string, string>();
  for (const u of usuariosSemilla) {
    const id = randomUUID();
    const hash = await hashearContrasena(u.contrasena);
    db.prepare(
      `INSERT INTO usuarios (id, email, contrasena_hash, nombre, rol, creado_en) VALUES (?, ?, ?, ?, ?, ?)`
    ).run(id, u.email, hash, u.nombre, u.rol, new Date().toISOString());
    idsUsuarios.set(u.email, id);
  }

  for (const e of espaciosSemilla) {
    db.prepare(
      `INSERT INTO espacios (id, tipo, nombre, planta, capacidad, equipamiento, pos_x, pos_y, ancho, alto, activo, bloqueado, motivo_bloqueo)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(
      e.id,
      e.tipo,
      e.nombre,
      e.planta,
      e.capacidad,
      JSON.stringify(e.equipamiento),
      e.posX,
      e.posY,
      e.ancho,
      e.alto,
      e.bloqueado ? 1 : 0,
      e.motivoBloqueo ?? null
    );
  }

  for (const r of reservasSemilla) {
    const usuarioId = idsUsuarios.get(r.emailUsuario);
    if (!usuarioId) continue;
    const inicio = aInstante(r.inicioLocal);
    const fin = aInstante(r.finLocal);
    const checkinEn = r.minutosHastaCheckin != null ? new Date(inicio.getTime() + r.minutosHastaCheckin * 60000).toISOString() : null;
    db.prepare(
      `INSERT INTO reservas (id, espacio_id, usuario_id, inicio, fin, estado, recurrencia_id, checkin_en, creado_en)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      randomUUID(),
      r.espacioId,
      usuarioId,
      inicio.toISOString(),
      fin.toISOString(),
      r.estado ?? "confirmada",
      r.recurrenciaId ?? null,
      checkinEn,
      new Date().toISOString()
    );
  }
}

async function ejecutarComoScript() {
  const ruta = process.env.RUTA_BASE_DE_DATOS ?? "data/reserva.db";
  const db = abrirBaseDeDatos(ruta);
  crearEsquema(db);
  await sembrar(db);
  console.log(`Base de datos sembrada en ${ruta}`);
  db.close();
}

const esEjecucionDirecta = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (esEjecucionDirecta) {
  ejecutarComoScript().catch((error) => {
    console.error("Fallo al sembrar la base de datos:", error);
    process.exit(1);
  });
}
