import { describe, expect, it } from "vitest";
import { VENTANA_CHECKIN_MINUTOS, debeLiberarsePorFaltaDeCheckin, puedeHacerCheckin } from "../src/engine/checkin.js";

const d = (s: string) => new Date(s);

describe("debeLiberarsePorFaltaDeCheckin", () => {
  const base = {
    estado: "confirmada" as const,
    inicio: d("2026-10-01T10:00:00Z"),
    fin: d("2026-10-01T11:00:00Z"),
    checkinEn: null,
  };

  it("no libera antes de cumplirse la ventana", () => {
    const ahora = new Date(base.inicio.getTime() + (VENTANA_CHECKIN_MINUTOS - 1) * 60000);
    expect(debeLiberarsePorFaltaDeCheckin(base, ahora)).toBe(false);
  });

  it("libera justo al cumplirse la ventana", () => {
    const ahora = new Date(base.inicio.getTime() + VENTANA_CHECKIN_MINUTOS * 60000);
    expect(debeLiberarsePorFaltaDeCheckin(base, ahora)).toBe(true);
  });

  it("no libera si ya se hizo check-in", () => {
    const conCheckin = { ...base, checkinEn: d("2026-10-01T10:05:00Z") };
    const ahora = new Date(base.inicio.getTime() + 30 * 60000);
    expect(debeLiberarsePorFaltaDeCheckin(conCheckin, ahora)).toBe(false);
  });

  it("no toca una reserva ya cancelada", () => {
    const cancelada = { ...base, estado: "cancelada" as const };
    const ahora = new Date(base.inicio.getTime() + 30 * 60000);
    expect(debeLiberarsePorFaltaDeCheckin(cancelada, ahora)).toBe(false);
  });
});

describe("puedeHacerCheckin", () => {
  const base = {
    estado: "confirmada" as const,
    inicio: d("2026-10-01T10:00:00Z"),
    fin: d("2026-10-01T11:00:00Z"),
    checkinEn: null,
  };

  it("permite check-in dentro de la ventana", () => {
    const ahora = new Date(base.inicio.getTime() + 5 * 60000);
    expect(puedeHacerCheckin(base, ahora)).toBe(true);
  });

  it("no permite check-in antes de que empiece", () => {
    const ahora = new Date(base.inicio.getTime() - 5 * 60000);
    expect(puedeHacerCheckin(base, ahora)).toBe(false);
  });

  it("no permite check-in pasada la ventana de liberacion", () => {
    const ahora = new Date(base.inicio.getTime() + VENTANA_CHECKIN_MINUTOS * 60000);
    expect(puedeHacerCheckin(base, ahora)).toBe(false);
  });
});
