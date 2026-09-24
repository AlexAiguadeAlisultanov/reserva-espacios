import { describe, expect, it } from "vitest";
import {
  REGLAS_POR_DEFECTO,
  dentroDeAntelacion,
  dentroDeHorarioDeOficina,
  duracionValida,
  espacioDisponibleParaReservar,
  validarFranja,
} from "../src/engine/reglas.js";
import { aInstante } from "../src/engine/tiempo.js";

describe("dentroDeHorarioDeOficina", () => {
  it("acepta una franja de un jueves dentro del horario", () => {
    // 2026-10-01 es jueves
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T11:00:00");
    expect(dentroDeHorarioDeOficina(inicio, fin, REGLAS_POR_DEFECTO).valido).toBe(true);
  });

  it("rechaza una franja que empieza antes de la apertura", () => {
    const inicio = aInstante("2026-10-01T07:00:00");
    const fin = aInstante("2026-10-01T08:00:00");
    const resultado = dentroDeHorarioDeOficina(inicio, fin, REGLAS_POR_DEFECTO);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toBe("fuera_de_horario");
  });

  it("rechaza una franja que termina despues del cierre", () => {
    const inicio = aInstante("2026-10-01T18:30:00");
    const fin = aInstante("2026-10-01T19:30:00");
    expect(dentroDeHorarioDeOficina(inicio, fin, REGLAS_POR_DEFECTO).valido).toBe(false);
  });

  it("rechaza un sabado", () => {
    // 2026-10-03 es sabado
    const inicio = aInstante("2026-10-03T10:00:00");
    const fin = aInstante("2026-10-03T11:00:00");
    const resultado = dentroDeHorarioDeOficina(inicio, fin, REGLAS_POR_DEFECTO);
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toBe("fin_de_semana");
  });
});

describe("duracionValida", () => {
  it("acepta 60 minutos", () => {
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T11:00:00");
    expect(duracionValida(inicio, fin, REGLAS_POR_DEFECTO).valido).toBe(true);
  });

  it("rechaza una duracion menor a la minima", () => {
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T10:05:00");
    expect(duracionValida(inicio, fin, REGLAS_POR_DEFECTO).motivo).toBe("duracion_invalida");
  });

  it("rechaza una duracion mayor a la maxima", () => {
    const inicio = aInstante("2026-10-01T09:00:00");
    const fin = aInstante("2026-10-01T14:00:00");
    expect(duracionValida(inicio, fin, REGLAS_POR_DEFECTO).motivo).toBe("duracion_excesiva");
  });

  it("rechaza fin antes o igual que inicio", () => {
    const inicio = aInstante("2026-10-01T10:00:00");
    expect(duracionValida(inicio, inicio, REGLAS_POR_DEFECTO).valido).toBe(false);
  });
});

describe("dentroDeAntelacion", () => {
  const ahora = aInstante("2026-10-01T09:00:00");

  it("rechaza una reserva en el pasado", () => {
    const inicio = aInstante("2026-09-30T09:00:00");
    expect(dentroDeAntelacion(inicio, ahora, REGLAS_POR_DEFECTO).motivo).toBe("en_el_pasado");
  });

  it("acepta dentro del limite de antelacion", () => {
    const inicio = aInstante("2026-10-15T09:00:00");
    expect(dentroDeAntelacion(inicio, ahora, REGLAS_POR_DEFECTO).valido).toBe(true);
  });

  it("rechaza mas alla del limite de antelacion", () => {
    const inicio = aInstante("2026-12-01T09:00:00");
    expect(dentroDeAntelacion(inicio, ahora, REGLAS_POR_DEFECTO).motivo).toBe("demasiada_antelacion");
  });
});

describe("espacioDisponibleParaReservar", () => {
  it("rechaza un espacio bloqueado", () => {
    expect(espacioDisponibleParaReservar({ activo: true, bloqueado: true }).motivo).toBe("espacio_bloqueado");
  });

  it("rechaza un espacio inactivo", () => {
    expect(espacioDisponibleParaReservar({ activo: false, bloqueado: false }).motivo).toBe("espacio_inactivo");
  });

  it("acepta un espacio activo y sin bloquear", () => {
    expect(espacioDisponibleParaReservar({ activo: true, bloqueado: false }).valido).toBe(true);
  });
});

describe("validarFranja", () => {
  it("combina todas las reglas y para en la primera que falla", () => {
    const ahora = aInstante("2026-10-01T08:00:00");
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T11:00:00");
    const resultado = validarFranja(inicio, fin, ahora, REGLAS_POR_DEFECTO, { activo: true, bloqueado: true });
    expect(resultado.valido).toBe(false);
    expect(resultado.motivo).toBe("espacio_bloqueado");
  });

  it("acepta una franja que cumple todo", () => {
    const ahora = aInstante("2026-10-01T08:00:00");
    const inicio = aInstante("2026-10-01T10:00:00");
    const fin = aInstante("2026-10-01T11:00:00");
    const resultado = validarFranja(inicio, fin, ahora, REGLAS_POR_DEFECTO, { activo: true, bloqueado: false });
    expect(resultado.valido).toBe(true);
  });
});
