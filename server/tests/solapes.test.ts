import { describe, expect, it } from "vitest";
import { encontrarConflictos, hayConflicto, seSolapan } from "../src/engine/solapes.js";

const d = (s: string) => new Date(s);

describe("seSolapan", () => {
  it("detecta un solape parcial", () => {
    const a = { inicio: d("2026-10-01T10:00:00Z"), fin: d("2026-10-01T11:00:00Z") };
    const b = { inicio: d("2026-10-01T10:30:00Z"), fin: d("2026-10-01T11:30:00Z") };
    expect(seSolapan(a, b)).toBe(true);
  });

  it("no hay solape cuando una termina justo cuando empieza la otra", () => {
    const a = { inicio: d("2026-10-01T10:00:00Z"), fin: d("2026-10-01T11:00:00Z") };
    const b = { inicio: d("2026-10-01T11:00:00Z"), fin: d("2026-10-01T12:00:00Z") };
    expect(seSolapan(a, b)).toBe(false);
  });

  it("detecta cuando una contiene totalmente a la otra", () => {
    const a = { inicio: d("2026-10-01T09:00:00Z"), fin: d("2026-10-01T12:00:00Z") };
    const b = { inicio: d("2026-10-01T10:00:00Z"), fin: d("2026-10-01T10:30:00Z") };
    expect(seSolapan(a, b)).toBe(true);
    expect(seSolapan(b, a)).toBe(true);
  });

  it("no hay solape entre dos intervalos separados", () => {
    const a = { inicio: d("2026-10-01T09:00:00Z"), fin: d("2026-10-01T10:00:00Z") };
    const b = { inicio: d("2026-10-01T14:00:00Z"), fin: d("2026-10-01T15:00:00Z") };
    expect(seSolapan(a, b)).toBe(false);
  });
});

describe("hayConflicto / encontrarConflictos", () => {
  const existentes = [
    { inicio: d("2026-10-01T09:00:00Z"), fin: d("2026-10-01T10:00:00Z") },
    { inicio: d("2026-10-01T12:00:00Z"), fin: d("2026-10-01T13:00:00Z") },
  ];

  it("encuentra conflicto contra la lista existente", () => {
    const nuevo = { inicio: d("2026-10-01T09:30:00Z"), fin: d("2026-10-01T09:45:00Z") };
    expect(hayConflicto(existentes, nuevo)).toBe(true);
    expect(encontrarConflictos(existentes, nuevo)).toHaveLength(1);
  });

  it("no hay conflicto en un hueco libre", () => {
    const nuevo = { inicio: d("2026-10-01T10:00:00Z"), fin: d("2026-10-01T11:00:00Z") };
    expect(hayConflicto(existentes, nuevo)).toBe(false);
    expect(encontrarConflictos(existentes, nuevo)).toHaveLength(0);
  });
});
