// La regla mas importante de toda la aplicacion: dos reservas del mismo
// espacio nunca pueden solaparse en el tiempo. Vive aqui, sola y sin
// dependencias, para poder probarla sin levantar servidor ni base de datos.

export interface Intervalo {
  inicio: Date;
  fin: Date;
}

/** Dos intervalos se solapan si uno empieza antes de que el otro termine, en ambos sentidos. */
export function seSolapan(a: Intervalo, b: Intervalo): boolean {
  return a.inicio < b.fin && b.inicio < a.fin;
}

/** Devuelve los intervalos existentes que chocan con el nuevo, si hay alguno. */
export function encontrarConflictos<T extends Intervalo>(existentes: T[], nuevo: Intervalo): T[] {
  return existentes.filter((existente) => seSolapan(existente, nuevo));
}

export function hayConflicto(existentes: Intervalo[], nuevo: Intervalo): boolean {
  return existentes.some((existente) => seSolapan(existente, nuevo));
}
