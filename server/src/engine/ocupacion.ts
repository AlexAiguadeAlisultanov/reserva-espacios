// Calculo de porcentajes de uso para el panel del administrador. Funciones
// puras que reciben reservas ya filtradas y devuelven numeros, sin tocar SQL.

export interface ReservaOcupacion {
  espacioId: string;
  inicio: Date;
  fin: Date;
  estado: "confirmada" | "cancelada" | "no_presentada";
}

export function minutosReservados(reservas: ReservaOcupacion[]): number {
  return reservas
    .filter((r) => r.estado === "confirmada")
    .reduce((total, r) => total + (r.fin.getTime() - r.inicio.getTime()) / 60000, 0);
}

export function porcentajeOcupacion(minutosUsados: number, minutosDisponibles: number): number {
  if (minutosDisponibles <= 0) return 0;
  const porcentaje = (minutosUsados / minutosDisponibles) * 100;
  return Math.round(Math.min(100, Math.max(0, porcentaje)) * 10) / 10;
}

export function contarNoPresentadas(reservas: ReservaOcupacion[]): number {
  return reservas.filter((r) => r.estado === "no_presentada").length;
}

/** Agrupa minutos reservados por dia de la semana local (1=lunes..7=domingo). */
export function minutosPorDiaSemana(
  reservas: ReservaOcupacion[],
  diaSemanaDe: (fecha: Date) => number
): Record<number, number> {
  const acumulado: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0 };
  for (const r of reservas) {
    if (r.estado !== "confirmada") continue;
    const dia = diaSemanaDe(r.inicio);
    acumulado[dia] = (acumulado[dia] ?? 0) + (r.fin.getTime() - r.inicio.getTime()) / 60000;
  }
  return acumulado;
}
