// Todas las horas de la interfaz son las de la oficina en Madrid, sin
// importar desde donde se abra la pagina (un reclutador mirando la demo
// desde otro huso horario tiene que ver las mismas 10:00 que alguien en la
// oficina). Se implementa con Intl.DateTimeFormat, que acepta una zona
// horaria explicita y no depende de la zona del navegador.

import type { Idioma } from "../i18n/diccionario.js";

export const ZONA_OFICINA = "Europe/Madrid";

const LOCALES: Record<Idioma, string> = { es: "es-ES", ca: "ca-ES", en: "en-GB" };

interface PartesFecha {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const FORMATEADOR_PARTES = new Intl.DateTimeFormat("en-US", {
  timeZone: ZONA_OFICINA,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

function partesEnMadrid(instante: Date): PartesFecha {
  const partes = FORMATEADOR_PARTES.formatToParts(instante).reduce<Record<string, string>>((acc, p) => {
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

/** "2026-10-01T10:00" (hora de pared en Madrid, sin zona) -> instante UTC real. */
export function aInstanteMadrid(fechaHoraLocal: string): Date {
  // "datetime-local" entrega "YYYY-MM-DDTHH:MM" (16 caracteres), sin segundos.
  const conSegundos = fechaHoraLocal.length === 16 ? `${fechaHoraLocal}:00` : fechaHoraLocal;
  const ingenuo = new Date(`${conSegundos}Z`);
  const comoLocal = partesEnMadrid(ingenuo);
  const reinterpretado = Date.UTC(comoLocal.year, comoLocal.month - 1, comoLocal.day, comoLocal.hour, comoLocal.minute, comoLocal.second);
  const offsetMs = reinterpretado - ingenuo.getTime();
  return new Date(ingenuo.getTime() - offsetMs);
}

export function fechaLocalMadrid(instante: Date = new Date()): string {
  const p = partesEnMadrid(instante);
  return `${p.year}-${String(p.month).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}

export function horaLocalMadrid(instanteIso: string): string {
  const p = partesEnMadrid(new Date(instanteIso));
  return `${String(p.hour).padStart(2, "0")}:${String(p.minute).padStart(2, "0")}`;
}

export function formatearFecha(instanteIso: string, idioma: Idioma): string {
  return new Intl.DateTimeFormat(LOCALES[idioma], { timeZone: ZONA_OFICINA, weekday: "short", day: "2-digit", month: "short" }).format(
    new Date(instanteIso)
  );
}

export function formatearFechaLarga(fechaYYYYMMDD: string, idioma: Idioma): string {
  const instante = aInstanteMadrid(`${fechaYYYYMMDD}T12:00`);
  return new Intl.DateTimeFormat(LOCALES[idioma], { timeZone: ZONA_OFICINA, weekday: "long", day: "2-digit", month: "long" }).format(instante);
}

export function formatearHora(instanteIso: string, idioma: Idioma): string {
  return new Intl.DateTimeFormat(LOCALES[idioma], { timeZone: ZONA_OFICINA, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(instanteIso)
  );
}

export function formatearImporteFecha(instanteIso: string, idioma: Idioma): string {
  return `${formatearFecha(instanteIso, idioma)}, ${formatearHora(instanteIso, idioma)}`;
}

/** Suma minutos a una hora "HH:MM" y devuelve otra "HH:MM" (sin cruzar de dia). */
export function sumarMinutosAHora(horaHHMM: string, minutos: number): string {
  const [h = 0, m = 0] = horaHHMM.split(":").map(Number);
  const total = h * 60 + m + minutos;
  const hh = Math.floor((total % (24 * 60)) / 60);
  const mm = total % 60;
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`;
}

export function fechaMasDias(fechaYYYYMMDD: string, dias: number): string {
  const [y, m, d] = fechaYYYYMMDD.split("-").map(Number);
  const fecha = new Date(Date.UTC(y!, (m ?? 1) - 1, (d ?? 1) + dias));
  return `${fecha.getUTCFullYear()}-${String(fecha.getUTCMonth() + 1).padStart(2, "0")}-${String(fecha.getUTCDate()).padStart(2, "0")}`;
}
