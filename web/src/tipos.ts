export type Rol = "empleado" | "admin";
export type TipoEspacio = "sala" | "puesto";
export type EstadoReserva = "confirmada" | "cancelada" | "no_presentada";
export type Equipamiento = "pantalla" | "videoconferencia" | "pizarra";
export type EstadoEspacioPlano = "libre" | "ocupado" | "bloqueado" | "inactivo";

export interface Usuario {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
}

export interface Espacio {
  id: string;
  tipo: TipoEspacio;
  nombre: string;
  planta: number;
  capacidad: number;
  equipamiento: Equipamiento[];
  posX: number;
  posY: number;
  ancho: number;
  alto: number;
  activo: boolean;
  bloqueado: boolean;
  motivoBloqueo: string | null;
}

export interface EspacioConEstado extends Espacio {
  estado: EstadoEspacioPlano;
  ocupadoPor?: string;
  ocupadoHasta?: string;
}

export interface Reserva {
  id: string;
  espacioId: string;
  usuarioId: string;
  inicio: string;
  fin: string;
  estado: EstadoReserva;
  recurrenciaId: string | null;
  checkinEn: string | null;
  creadoEn: string;
}

export interface ReservaConEspacio extends Reserva {
  espacioNombre: string;
  espacioTipo: TipoEspacio;
  planta: number;
  puedeHacerCheckin: boolean;
}

export interface FranjaAgenda {
  inicio: string;
  fin: string;
  estado: "libre" | "ocupado";
  reservaId?: string;
  usuarioNombre?: string;
}

export interface ReglasOficina {
  antelacionMaximaDias: number;
  duracionMaximaMinutos: number;
  duracionMinimaMinutos: number;
  apertura: string;
  cierre: string;
}

export interface OcupacionPorEspacio {
  espacioId: string;
  nombre: string;
  tipo: TipoEspacio;
  porcentaje: number;
  noPresentadas: number;
}

export interface PanelOcupacion {
  porEspacio: OcupacionPorEspacio[];
  porDiaSemana: { dia: number; porcentaje: number }[];
  totalNoPresentadas: number;
}
