/** Opciones de hora cada 30 minutos entre dos limites, en formato "HH:MM". */
export function opcionesHora(desde = "07:00", hasta = "21:00"): string[] {
  const [h0 = 7, m0 = 0] = desde.split(":").map(Number);
  const [h1 = 21, m1 = 0] = hasta.split(":").map(Number);
  const inicioMin = h0 * 60 + m0;
  const finMin = h1 * 60 + m1;
  const opciones: string[] = [];
  for (let m = inicioMin; m <= finMin; m += 30) {
    const h = Math.floor(m / 60);
    const mm = m % 60;
    opciones.push(`${String(h).padStart(2, "0")}:${String(mm).padStart(2, "0")}`);
  }
  return opciones;
}
