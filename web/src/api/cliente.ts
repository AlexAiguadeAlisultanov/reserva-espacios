// Cliente HTTP fino sobre fetch: siempre manda cookies, siempre trata el
// cuerpo como JSON y convierte una respuesta de error en una excepcion que
// las pantallas pueden capturar y traducir con el diccionario.

export class ErrorApi extends Error {
  codigo: number;
  motivo: string;
  detalle?: unknown;
  constructor(codigo: number, motivo: string, detalle?: unknown) {
    super(motivo);
    this.codigo = codigo;
    this.motivo = motivo;
    this.detalle = detalle;
  }
}

async function peticion<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  const respuesta = await fetch(`/api${ruta}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers,
    },
    ...opciones,
  });

  if (respuesta.status === 204) return undefined as T;

  let cuerpo: unknown = null;
  const texto = await respuesta.text();
  if (texto) {
    try {
      cuerpo = JSON.parse(texto);
    } catch {
      cuerpo = null;
    }
  }

  if (!respuesta.ok) {
    const motivo = (cuerpo as { error?: string } | null)?.error ?? "generico";
    throw new ErrorApi(respuesta.status, motivo, (cuerpo as { detalle?: unknown } | null)?.detalle);
  }

  return cuerpo as T;
}

export const api = {
  get: <T,>(ruta: string) => peticion<T>(ruta),
  post: <T,>(ruta: string, cuerpo?: unknown) =>
    peticion<T>(ruta, { method: "POST", body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined }),
  patch: <T,>(ruta: string, cuerpo?: unknown) =>
    peticion<T>(ruta, { method: "PATCH", body: cuerpo !== undefined ? JSON.stringify(cuerpo) : undefined }),
  delete: <T,>(ruta: string) => peticion<T>(ruta, { method: "DELETE" }),
};

export function construirQuery(parametros: Record<string, string | number | undefined>): string {
  const busqueda = new URLSearchParams();
  for (const [clave, valor] of Object.entries(parametros)) {
    if (valor !== undefined && valor !== "") busqueda.set(clave, String(valor));
  }
  const texto = busqueda.toString();
  return texto ? `?${texto}` : "";
}
