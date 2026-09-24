import { describe, expect, it } from "vitest";
import { generarOcurrenciasSemanales } from "../src/engine/recurrencia.js";
import { aInstante, diaSemanaLocal, horaLocal } from "../src/engine/tiempo.js";

describe("generarOcurrenciasSemanales", () => {
  it("genera una ocurrencia por semana hasta el limite, inclusive", () => {
    const inicio = aInstante("2026-10-01T10:00:00"); // jueves
    const fin = aInstante("2026-10-01T11:00:00");
    const hasta = aInstante("2026-10-22T00:00:00");
    const ocurrencias = generarOcurrenciasSemanales(inicio, fin, hasta);
    expect(ocurrencias).toHaveLength(4); // 1, 8, 15, 22 de octubre
  });

  it("conserva la hora de pared local al cruzar el cambio de horario de octubre", () => {
    // El horario de invierno en Espana empieza el ultimo domingo de octubre de 2026 (25 oct).
    const inicio = aInstante("2026-10-15T10:00:00");
    const fin = aInstante("2026-10-15T11:00:00");
    const hasta = aInstante("2026-11-05T00:00:00");
    const ocurrencias = generarOcurrenciasSemanales(inicio, fin, hasta);
    expect(ocurrencias.length).toBeGreaterThanOrEqual(3);
    for (const ocurrencia of ocurrencias) {
      expect(horaLocal(ocurrencia.inicio)).toBe("10:00");
      expect(horaLocal(ocurrencia.fin)).toBe("11:00");
      expect(diaSemanaLocal(ocurrencia.inicio)).toBe(4); // sigue siendo jueves
    }
  });

  it("no genera ninguna ocurrencia si el limite es anterior al inicio", () => {
    const inicio = aInstante("2026-10-15T10:00:00");
    const fin = aInstante("2026-10-15T11:00:00");
    const hasta = aInstante("2026-10-10T00:00:00");
    expect(generarOcurrenciasSemanales(inicio, fin, hasta)).toHaveLength(0);
  });
});
