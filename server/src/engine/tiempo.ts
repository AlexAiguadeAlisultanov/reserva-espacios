// Toda hora que ve una persona es la de Europe/Madrid. Toda hora que se guarda
// en la base de datos es un instante UTC. Este modulo es el unico sitio del
// servidor que convierte entre las dos.
//
// Se implementa a mano con Intl.DateTimeFormat (que acepta una zona horaria
// explicita y no depende de la zona del sistema) en lugar de una libreria,
// porque una prueba concreta con date-fns-tz mostro que su resultado si
// cambiaba segun la zona horaria del proceso, algo inaceptable para una
// aplicacion que reserva salas por hora.

export const ZONA_OFICINA = "Europe/Madrid";

interface PartesFecha {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const FORMATEADOR = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_OFICINA,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function partesEnZona(instante: Date): PartesFecha {
  const partes = FORMATEADOR.formatToParts(instante).reduce<Record<string, string>>((acc, p) => {
    if (p.type !== "literal") acc[p.type] = p.value;
    return acc;
  }, {});
  return {
    year: Number(partes.year),
    month: Number(partes.month),
    day: Number(partes.day),
    hour: Number(partes.hour),
    minute: Number(partes.minute),
    second: Number(partes.second),
  };
}

/** Convierte una fecha y hora "de pared" en Madrid (sin zona) a un instante UTC. */
export function aInstante(fechaHoraLocal: string): Date {
  const ingenuo = new Date(`${fechaHoraLocal}Z`);
  if (Number.isNaN(ingenuo.getTime())) throw new Error(`fecha_local_invalida: ${fechaHoraLocal}`);
  // El desfase entre "como se leerian estos digitos en Madrid" y "estos digitos
  // como UTC" es el offset de la zona en ese momento (una aproximacion valida
  // salvo en el instante exacto del cambio de hora, que no aplica a horario de oficina).
  const comoLocal = partesEnZona(ingenuo);
  const reinterpretado = Date.UTC(comoLocal.year, comoLocal.month - 1, comoLocal.day, comoLocal.hour, comoLocal.minute, comoLocal.second);
  const offsetMs = reinterpretado - ingenuo.getTime();
  return new Date(ingenuo.getTime() - offsetMs);
}

/** Convierte un instante UTC a un Date cuyos campos UTC representan la hora local de Madrid. */
export function aLocal(instante: Date): Date {
  const p = partesEnZona(instante);
  return new Date(Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second));
}

/** Dia de la semana en Madrid, 1 = lunes ... 7 = domingo (ISO). */
export function diaSemanaLocal(instante: Date): number {
  const local = aLocal(instante);
  const dia = local.getUTCDay();
  return dia === 0 ? 7 : dia;
}

/** Hora local en formato HH:MM, para comparar con el horario de apertura/cierre. */
export function horaLocal(instante: Date): string {
  const local = aLocal(instante);
  const h = String(local.getUTCHours()).padStart(2, "0");
  const m = String(local.getUTCMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** Fecha local en formato YYYY-MM-DD. */
export function fechaLocal(instante: Date): string {
  const local = aLocal(instante);
  const y = local.getUTCFullYear();
  const m = String(local.getUTCMonth() + 1).padStart(2, "0");
  const d = String(local.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Suma semanas enteras a un instante conservando la hora de pared local
 * (imprescindible al cruzar el cambio de hora: sumar 7*24h en UTC desplazaria
 * la reunion una hora cuando hay cambio de horario de por medio). */
export function sumarSemanasConservandoHoraLocal(instante: Date, semanas: number): Date {
  const local = aLocal(instante);
  const y = local.getUTCFullYear();
  const mo = local.getUTCMonth();
  const d = local.getUTCDate();
  const h = local.getUTCHours();
  const mi = local.getUTCMinutes();
  const s = local.getUTCSeconds();
  const nuevaFechaLocal = new Date(Date.UTC(y, mo, d + semanas * 7, h, mi, s));
  const iso = `${nuevaFechaLocal.getUTCFullYear()}-${String(nuevaFechaLocal.getUTCMonth() + 1).padStart(2, "0")}-${String(nuevaFechaLocal.getUTCDate()).padStart(2, "0")}T${String(nuevaFechaLocal.getUTCHours()).padStart(2, "0")}:${String(nuevaFechaLocal.getUTCMinutes()).padStart(2, "0")}:${String(nuevaFechaLocal.getUTCSeconds()).padStart(2, "0")}`;
  return aInstante(iso);
}
