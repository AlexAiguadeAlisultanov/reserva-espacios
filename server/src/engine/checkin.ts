// Si nadie confirma su llegada en los primeros minutos, la reserva se libera
// sola para que otra persona pueda usar el espacio. No hay cron: esto se
// calcula al vuelo cada vez que se consulta disponibilidad o se lista una
// reserva, comparando contra la hora actual.

export const VENTANA_CHECKIN_MINUTOS = 15;

export interface ReservaParaCheckin {
  estado: "confirmada" | "cancelada" | "no_presentada";
  inicio: Date;
  fin: Date;
  checkinEn: Date | null;
}

/** Verdadero si la reserva deberia pasar a "no_presentada" en este instante. */
export function debeLiberarsePorFaltaDeCheckin(reserva: ReservaParaCheckin, ahora: Date): boolean {
  if (reserva.estado !== "confirmada" || reserva.checkinEn) return false;
  const limite = new Date(reserva.inicio.getTime() + VENTANA_CHECKIN_MINUTOS * 60000);
  return ahora >= limite;
}

/** Verdadero si todavia se puede hacer check-in (la reserva esta en curso o a punto de empezar). */
export function puedeHacerCheckin(reserva: ReservaParaCheckin, ahora: Date): boolean {
  if (reserva.estado !== "confirmada" || reserva.checkinEn) return false;
  if (ahora < reserva.inicio) return false;
  if (ahora >= reserva.fin) return false;
  return !debeLiberarsePorFaltaDeCheckin(reserva, ahora);
}
