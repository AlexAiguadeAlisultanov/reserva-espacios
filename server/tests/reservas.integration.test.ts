// Pruebas de integracion contra SQLite real (en memoria): la regla que mas
// importa es que dos reservas del mismo espacio nunca se solapen, ni siquiera
// cuando una de ellas viene de una serie recurrente, y que todo se compruebe
// dentro de una unica transaccion.

import { randomUUID } from "node:crypto";
import { beforeEach, describe, expect, it } from "vitest";
import { abrirBaseDeDatos, crearEsquema, type BaseDeDatos } from "../src/db.js";
import { aInstante } from "../src/engine/tiempo.js";
import { ErrorReserva, cancelarReserva, crearReserva, crearReservaRecurrente, listarReservasDeUsuario, obtenerReserva, registrarCheckin } from "../src/servicios/reservas.js";

let db: BaseDeDatos;
let empleadoA: string;
let empleadoB: string;
let admin: string;
let sala: string;
let puesto1: string;
let puesto2: string;

function insertarUsuario(rol: "empleado" | "admin"): string {
  const id = randomUUID();
  db.prepare(`INSERT INTO usuarios (id, email, contrasena_hash, nombre, rol, creado_en) VALUES (?, ?, 'x', ?, ?, ?)`).run(
    id,
    `${id}@empresa.test`,
    "Persona de prueba",
    rol,
    new Date().toISOString()
  );
  return id;
}

function insertarEspacio(tipo: "sala" | "puesto", capacidad = 6): string {
  const id = randomUUID();
  db.prepare(
    `INSERT INTO espacios (id, tipo, nombre, planta, capacidad, equipamiento, pos_x, pos_y, ancho, alto, activo, bloqueado, motivo_bloqueo)
     VALUES (?, ?, 'Espacio de prueba', 1, ?, '[]', 0, 0, 10, 10, 1, 0, NULL)`
  ).run(id, tipo, capacidad);
  return id;
}

beforeEach(() => {
  db = abrirBaseDeDatos(":memory:");
  crearEsquema(db);
  empleadoA = insertarUsuario("empleado");
  empleadoB = insertarUsuario("empleado");
  admin = insertarUsuario("admin");
  sala = insertarEspacio("sala");
  puesto1 = insertarEspacio("puesto");
  puesto2 = insertarEspacio("puesto");
});

const ahora = aInstante("2026-10-01T08:00:00"); // jueves, antes de que abra la oficina

describe("crearReserva: solape del mismo espacio", () => {
  it("permite la primera reserva y rechaza una que se solapa", () => {
    crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });

    expect(() =>
      crearReserva(db, { espacioId: sala, usuarioId: empleadoB, inicio: aInstante("2026-10-01T10:30:00"), fin: aInstante("2026-10-01T11:30:00"), ahora })
    ).toThrow(ErrorReserva);
  });

  it("no deja rastro en la base de datos cuando la reserva se rechaza", () => {
    crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    try {
      crearReserva(db, { espacioId: sala, usuarioId: empleadoB, inicio: aInstante("2026-10-01T10:30:00"), fin: aInstante("2026-10-01T11:30:00"), ahora });
    } catch {
      // se espera el rechazo
    }
    const total = db.prepare("SELECT COUNT(*) AS n FROM reservas WHERE espacio_id = ?").get(sala) as { n: number };
    expect(total.n).toBe(1);
  });

  it("permite dos reservas del mismo espacio que no se tocan", () => {
    crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    expect(() =>
      crearReserva(db, { espacioId: sala, usuarioId: empleadoB, inicio: aInstante("2026-10-01T11:00:00"), fin: aInstante("2026-10-01T12:00:00"), ahora })
    ).not.toThrow();
  });
});

describe("crearReserva: un puesto por persona y franja", () => {
  it("rechaza un segundo puesto simultaneo del mismo empleado", () => {
    crearReserva(db, { espacioId: puesto1, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    expect(() =>
      crearReserva(db, { espacioId: puesto2, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:30:00"), fin: aInstante("2026-10-01T11:30:00"), ahora })
    ).toThrow(ErrorReserva);
  });

  it("permite el mismo puesto reservado por otra persona en otra franja", () => {
    crearReserva(db, { espacioId: puesto1, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    expect(() =>
      crearReserva(db, { espacioId: puesto2, usuarioId: empleadoB, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora })
    ).not.toThrow();
  });
});

describe("crearReserva: reglas de horario y bloqueo", () => {
  it("rechaza fuera del horario de oficina", () => {
    expect(() =>
      crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T20:00:00"), fin: aInstante("2026-10-01T21:00:00"), ahora })
    ).toThrow(ErrorReserva);
  });

  it("rechaza un espacio bloqueado", () => {
    db.prepare("UPDATE espacios SET bloqueado = 1, motivo_bloqueo = 'obras' WHERE id = ?").run(sala);
    expect(() =>
      crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora })
    ).toThrow(ErrorReserva);
  });
});

describe("crearReservaRecurrente", () => {
  it("crea todas las ocurrencias cuando ninguna choca", () => {
    const reservas = crearReservaRecurrente(db, {
      espacioId: sala,
      usuarioId: empleadoA,
      inicio: aInstante("2026-10-01T10:00:00"),
      fin: aInstante("2026-10-01T10:30:00"),
      hasta: aInstante("2026-10-22T00:00:00"),
      ahora,
    });
    expect(reservas).toHaveLength(4);
    expect(new Set(reservas.map((r) => r.recurrenciaId)).size).toBe(1);
  });

  it("si una sola ocurrencia choca, no se crea ninguna de la serie (todo o nada)", () => {
    crearReserva(db, { espacioId: sala, usuarioId: empleadoB, inicio: aInstante("2026-10-15T10:00:00"), fin: aInstante("2026-10-15T10:30:00"), ahora });

    expect(() =>
      crearReservaRecurrente(db, {
        espacioId: sala,
        usuarioId: empleadoA,
        inicio: aInstante("2026-10-01T10:00:00"),
        fin: aInstante("2026-10-01T10:30:00"),
        hasta: aInstante("2026-10-22T00:00:00"),
        ahora,
      })
    ).toThrow(ErrorReserva);

    const total = db.prepare("SELECT COUNT(*) AS n FROM reservas WHERE espacio_id = ? AND usuario_id = ?").get(sala, empleadoA) as { n: number };
    expect(total.n).toBe(0);
  });
});

describe("cancelarReserva", () => {
  it("el dueno puede cancelar su reserva", () => {
    const reserva = crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    const [cancelada] = cancelarReserva(db, reserva.id, { id: empleadoA, rol: "empleado" }, false);
    expect(cancelada.estado).toBe("cancelada");
  });

  it("otro empleado no puede cancelar la reserva ajena", () => {
    const reserva = crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    expect(() => cancelarReserva(db, reserva.id, { id: empleadoB, rol: "empleado" }, false)).toThrow(ErrorReserva);
  });

  it("el administrador si puede cancelar la reserva de otra persona", () => {
    const reserva = crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    const [cancelada] = cancelarReserva(db, reserva.id, { id: admin, rol: "admin" }, false);
    expect(cancelada.estado).toBe("cancelada");
  });

  it("una vez cancelada, el hueco vuelve a estar disponible", () => {
    const reserva = crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora });
    cancelarReserva(db, reserva.id, { id: empleadoA, rol: "empleado" }, false);
    expect(() =>
      crearReserva(db, { espacioId: sala, usuarioId: empleadoB, inicio: aInstante("2026-10-01T10:00:00"), fin: aInstante("2026-10-01T11:00:00"), ahora })
    ).not.toThrow();
  });
});

describe("check-in y liberacion automatica", () => {
  it("libera el espacio si no hay check-in pasada la ventana, y deja reservar de nuevo", () => {
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T11:00:00");
    const reserva = crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio, fin, ahora });

    const pasados20min = new Date(inicio.getTime() + 20 * 60000);
    // La nueva reserva empieza justo ahora (el hueco liberado), no en el pasado.
    expect(() =>
      crearReserva(db, { espacioId: sala, usuarioId: empleadoB, inicio: pasados20min, fin, ahora: pasados20min })
    ).not.toThrow();

    const original = obtenerReserva(db, reserva.id)!;
    expect(original.estado).toBe("no_presentada");
  });

  it("el check-in a tiempo evita que se libere", () => {
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T11:00:00");
    const reserva = crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio, fin, ahora });
    const a5min = new Date(inicio.getTime() + 5 * 60000);
    registrarCheckin(db, reserva.id, { id: empleadoA, rol: "empleado" }, a5min);

    const pasados20min = new Date(inicio.getTime() + 20 * 60000);
    try {
      crearReserva(db, { espacioId: sala, usuarioId: empleadoB, inicio: pasados20min, fin, ahora: pasados20min });
      expect.unreachable("deberia haber rechazado la reserva solapada");
    } catch (error) {
      expect(error).toBeInstanceOf(ErrorReserva);
      expect((error as ErrorReserva).motivo).toBe("solape_espacio");
    }
  });

  it("listarReservasDeUsuario refleja la liberacion automatica", () => {
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T11:00:00");
    crearReserva(db, { espacioId: sala, usuarioId: empleadoA, inicio, fin, ahora });
    const pasados20min = new Date(inicio.getTime() + 20 * 60000);
    const lista = listarReservasDeUsuario(db, empleadoA, pasados20min);
    expect(lista[0].estado).toBe("no_presentada");
  });
});
