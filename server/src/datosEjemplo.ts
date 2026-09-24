// Datos de ejemplo para que la demo nunca arranque vacia: una oficina de dos
// plantas, cinco salas, treinta puestos y una semana de reservas creibles.

import type { Equipamiento, Rol, TipoEspacio } from "./tipos.js";

export interface UsuarioSemilla {
  email: string;
  nombre: string;
  rol: Rol;
  contrasena: string;
}

export const CONTRASENA_DEMO = "prova1234";

export const usuariosSemilla: UsuarioSemilla[] = [
  { email: "nuria@empresa.test", nombre: "Núria Camps", rol: "empleado", contrasena: CONTRASENA_DEMO },
  { email: "pau@empresa.test", nombre: "Pau Ferrer", rol: "empleado", contrasena: CONTRASENA_DEMO },
  { email: "oficina@empresa.test", nombre: "Oficina", rol: "admin", contrasena: CONTRASENA_DEMO },
  { email: "marta.soler@empresa.test", nombre: "Marta Soler", rol: "empleado", contrasena: CONTRASENA_DEMO },
  { email: "javier.molina@empresa.test", nombre: "Javier Molina", rol: "empleado", contrasena: CONTRASENA_DEMO },
  { email: "laia.puig@empresa.test", nombre: "Laia Puig", rol: "empleado", contrasena: CONTRASENA_DEMO },
  { email: "carlos.reyes@empresa.test", nombre: "Carlos Reyes", rol: "empleado", contrasena: CONTRASENA_DEMO },
];

export interface EspacioSemilla {
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
  bloqueado?: boolean;
  motivoBloqueo?: string;
}

const salas: EspacioSemilla[] = [
  { id: "sala-aurora", tipo: "sala", nombre: "Sala Aurora", planta: 1, capacidad: 6, equipamiento: ["pantalla", "videoconferencia"], posX: 40, posY: 40, ancho: 220, alto: 150 },
  { id: "sala-nervion", tipo: "sala", nombre: "Sala Nervión", planta: 1, capacidad: 10, equipamiento: ["pantalla", "videoconferencia", "pizarra"], posX: 300, posY: 40, ancho: 280, alto: 150 },
  { id: "sala-turia", tipo: "sala", nombre: "Sala Turia", planta: 1, capacidad: 4, equipamiento: ["pizarra"], posX: 620, posY: 40, ancho: 200, alto: 150 },
  { id: "sala-ebro", tipo: "sala", nombre: "Sala Ebro", planta: 2, capacidad: 8, equipamiento: ["pantalla", "videoconferencia", "pizarra"], posX: 40, posY: 40, ancho: 260, alto: 170 },
  {
    id: "sala-duero",
    tipo: "sala",
    nombre: "Sala Duero",
    planta: 2,
    capacidad: 2,
    equipamiento: ["pantalla"],
    posX: 340,
    posY: 40,
    ancho: 160,
    alto: 130,
    bloqueado: true,
    motivoBloqueo: "Obras de climatización hasta el 3 de octubre",
  },
];

function generarPuestos(planta: number, cantidad: number): EspacioSemilla[] {
  const puestos: EspacioSemilla[] = [];
  for (let i = 0; i < cantidad; i++) {
    const col = i % 4;
    const fila = Math.floor(i / 4);
    const numero = String(i + 1).padStart(2, "0");
    puestos.push({
      id: `puesto-${planta}-${numero}`,
      tipo: "puesto",
      nombre: `Puesto ${planta}.${numero}`,
      planta,
      capacidad: 1,
      equipamiento: [],
      posX: 60 + col * 210,
      posY: 250 + fila * 90,
      ancho: 70,
      alto: 52,
    });
  }
  return puestos;
}

export const espaciosSemilla: EspacioSemilla[] = [...salas, ...generarPuestos(1, 16), ...generarPuestos(2, 14)];

export interface ReservaSemilla {
  espacioId: string;
  emailUsuario: string;
  inicioLocal: string; // "YYYY-MM-DDTHH:MM:SS" en hora de Madrid
  finLocal: string;
  estado?: "confirmada" | "cancelada";
  minutosHastaCheckin?: number; // si se indica, se registra check-in ese rato despues del inicio
  recurrenciaId?: string;
}

// Fechas relativas a la semana del lunes 2026-09-21 y a la siguiente,
// coherentes con la fecha real en la que se construyo la demo (25 sep 2026).
export const reservasSemilla: ReservaSemilla[] = [
  // Semana actual: una reunion sin check-in (para ver el aviso de no presentada).
  { espacioId: "sala-nervion", emailUsuario: "marta.soler@empresa.test", inicioLocal: "2026-09-21T10:00:00", finLocal: "2026-09-21T11:00:00" },
  { espacioId: "puesto-1-03", emailUsuario: "javier.molina@empresa.test", inicioLocal: "2026-09-22T09:00:00", finLocal: "2026-09-22T13:00:00", minutosHastaCheckin: 5 },
  { espacioId: "sala-aurora", emailUsuario: "laia.puig@empresa.test", inicioLocal: "2026-09-23T14:00:00", finLocal: "2026-09-23T15:00:00", minutosHastaCheckin: 3 },
  { espacioId: "puesto-1-02", emailUsuario: "nuria@empresa.test", inicioLocal: "2026-09-23T16:00:00", finLocal: "2026-09-23T16:30:00", estado: "cancelada" },
  { espacioId: "sala-ebro", emailUsuario: "carlos.reyes@empresa.test", inicioLocal: "2026-09-24T11:00:00", finLocal: "2026-09-24T12:00:00" },
  { espacioId: "puesto-1-01", emailUsuario: "nuria@empresa.test", inicioLocal: "2026-09-25T09:00:00", finLocal: "2026-09-25T13:00:00", minutosHastaCheckin: 4 },
  { espacioId: "puesto-2-01", emailUsuario: "pau@empresa.test", inicioLocal: "2026-09-25T15:00:00", finLocal: "2026-09-25T18:00:00" },

  // Semana siguiente: todo por delante, ninguna con check-in todavia.
  { espacioId: "sala-nervion", emailUsuario: "nuria@empresa.test", inicioLocal: "2026-09-28T10:00:00", finLocal: "2026-09-28T11:00:00" },
  { espacioId: "puesto-1-05", emailUsuario: "nuria@empresa.test", inicioLocal: "2026-09-29T09:30:00", finLocal: "2026-09-29T14:00:00" },
  { espacioId: "sala-ebro", emailUsuario: "marta.soler@empresa.test", inicioLocal: "2026-09-30T13:00:00", finLocal: "2026-09-30T14:00:00" },
  { espacioId: "puesto-1-08", emailUsuario: "pau@empresa.test", inicioLocal: "2026-10-01T10:00:00", finLocal: "2026-10-01T18:00:00" },
  { espacioId: "sala-aurora", emailUsuario: "javier.molina@empresa.test", inicioLocal: "2026-10-02T11:00:00", finLocal: "2026-10-02T12:00:00" },

  // Serie recurrente: sincronizacion semanal del equipo, todos los martes.
  { espacioId: "sala-turia", emailUsuario: "nuria@empresa.test", inicioLocal: "2026-09-29T09:00:00", finLocal: "2026-09-29T09:30:00", recurrenciaId: "recurrencia-sync-equipo" },
  { espacioId: "sala-turia", emailUsuario: "nuria@empresa.test", inicioLocal: "2026-10-06T09:00:00", finLocal: "2026-10-06T09:30:00", recurrenciaId: "recurrencia-sync-equipo" },
  { espacioId: "sala-turia", emailUsuario: "nuria@empresa.test", inicioLocal: "2026-10-13T09:00:00", finLocal: "2026-10-13T09:30:00", recurrenciaId: "recurrencia-sync-equipo" },
];
