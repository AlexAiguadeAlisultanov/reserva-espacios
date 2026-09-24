import { api, construirQuery } from "./cliente.js";
import type {
  Espacio,
  EspacioConEstado,
  Equipamiento,
  FranjaAgenda,
  OcupacionPorEspacio,
  PanelOcupacion,
  ReglasOficina,
  Reserva,
  ReservaConEspacio,
  TipoEspacio,
  Usuario,
} from "../tipos.js";

export const authApi = {
  entrar: (email: string, contrasena: string) => api.post<Usuario>("/auth/entrar", { email, contrasena }),
  salir: () => api.post<void>("/auth/salir"),
  yo: () => api.get<Usuario>("/auth/yo"),
};

export const espaciosApi = {
  listar: (planta?: number) => api.get<Espacio[]>(`/espacios${construirQuery({ planta })}`),
  disponibilidad: (inicio: string, fin: string, planta?: number) =>
    api.get<EspacioConEstado[]>(`/espacios/disponibilidad${construirQuery({ inicio, fin, planta })}`),
  busqueda: (filtros: {
    inicio: string;
    fin: string;
    tipo?: TipoEspacio;
    planta?: number;
    capacidadMinima?: number;
    equipamiento?: Equipamiento[];
  }) =>
    api.get<Espacio[]>(
      `/espacios/busqueda${construirQuery({
        inicio: filtros.inicio,
        fin: filtros.fin,
        tipo: filtros.tipo,
        planta: filtros.planta,
        capacidadMinima: filtros.capacidadMinima,
        equipamiento: filtros.equipamiento?.length ? filtros.equipamiento.join(",") : undefined,
      })}`
    ),
  agenda: (espacioId: string, fecha: string) => api.get<FranjaAgenda[]>(`/espacios/agenda${construirQuery({ espacioId, fecha })}`),
};

export interface RespuestaCrearReserva {
  reserva?: Reserva;
  reservas?: Reserva[];
}

export const reservasApi = {
  mias: () => api.get<ReservaConEspacio[]>("/reservas/mias"),
  crear: (datos: { espacioId: string; inicio: string; fin: string; recurrente?: { hasta: string } }) =>
    api.post<RespuestaCrearReserva>("/reservas", datos),
  checkin: (id: string) => api.post<Reserva>(`/reservas/${id}/checkin`),
  cancelar: (id: string, todaLaSerie: boolean) => api.post<{ reservas: Reserva[] }>(`/reservas/${id}/cancelar`, { todaLaSerie }),
};

export const adminApi = {
  espacios: () => api.get<Espacio[]>("/admin/espacios"),
  crearEspacio: (datos: {
    tipo: TipoEspacio;
    nombre: string;
    planta: number;
    capacidad: number;
    equipamiento: Equipamiento[];
    posX: number;
    posY: number;
    ancho: number;
    alto: number;
  }) => api.post<Espacio>("/admin/espacios", datos),
  actualizarEspacio: (
    id: string,
    cambios: Partial<{
      nombre: string;
      capacidad: number;
      equipamiento: Equipamiento[];
      activo: boolean;
      bloqueado: boolean;
      motivoBloqueo: string | null;
    }>
  ) => api.patch<Espacio>(`/admin/espacios/${id}`, cambios),
  darDeBaja: (id: string) => api.delete<void>(`/admin/espacios/${id}`),
  reglas: () => api.get<ReglasOficina>("/admin/reglas"),
  actualizarReglas: (cambios: Partial<ReglasOficina>) => api.patch<ReglasOficina>("/admin/reglas", cambios),
  ocupacion: (desde: string, hasta: string) => api.get<PanelOcupacion>(`/admin/ocupacion${construirQuery({ desde, hasta })}`),
};

export type { OcupacionPorEspacio };
