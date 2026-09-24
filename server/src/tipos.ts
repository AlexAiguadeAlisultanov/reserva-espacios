export type Rol = "empleado" | "admin";
export type TipoEspacio = "sala" | "puesto";
export type EstadoReserva = "confirmada" | "cancelada" | "no_presentada";
export type Equipamiento = "pantalla" | "videoconferencia" | "pizarra";

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

export interface Reserva {
  id: string;
  espacioId: string;
  usuarioId: string;
  inicio: string; // ISO UTC
  fin: string; // ISO UTC
  estado: EstadoReserva;
  recurrenciaId: string | null;
  checkinEn: string | null;
  creadoEn: string;
}
