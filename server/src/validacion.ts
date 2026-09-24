import { z } from "zod";

export const esquemaLogin = z.object({
  email: z.string().email(),
  contrasena: z.string().min(1),
});

const fechaHoraIso = z.string().refine((valor) => !Number.isNaN(Date.parse(valor)), {
  message: "fecha_invalida",
});

export const esquemaCrearReserva = z
  .object({
    espacioId: z.string().min(1),
    inicio: fechaHoraIso,
    fin: fechaHoraIso,
    recurrente: z
      .object({
        hasta: fechaHoraIso,
      })
      .optional(),
  })
  .refine((datos) => Date.parse(datos.fin) > Date.parse(datos.inicio), {
    message: "fin_antes_que_inicio",
    path: ["fin"],
  });

export const esquemaBusqueda = z.object({
  inicio: fechaHoraIso,
  fin: fechaHoraIso,
  tipo: z.enum(["sala", "puesto"]).optional(),
  planta: z.coerce.number().int().optional(),
  capacidadMinima: z.coerce.number().int().min(1).optional(),
  equipamiento: z
    .string()
    .optional()
    .transform((valor) => (valor ? valor.split(",").filter(Boolean) : [])),
});

export const esquemaDisponibilidad = z.object({
  inicio: fechaHoraIso,
  fin: fechaHoraIso,
  planta: z.coerce.number().int().optional(),
});

export const esquemaAgenda = z.object({
  espacioId: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export const equipamientoValido = z.enum(["pantalla", "videoconferencia", "pizarra"]);

export const esquemaCrearEspacio = z.object({
  tipo: z.enum(["sala", "puesto"]),
  nombre: z.string().min(1).max(80),
  planta: z.coerce.number().int().min(1).max(2),
  capacidad: z.coerce.number().int().min(1).max(100),
  equipamiento: z.array(equipamientoValido).default([]),
  posX: z.coerce.number(),
  posY: z.coerce.number(),
  ancho: z.coerce.number().positive(),
  alto: z.coerce.number().positive(),
});

export const esquemaActualizarEspacio = z.object({
  nombre: z.string().min(1).max(80).optional(),
  capacidad: z.coerce.number().int().min(1).max(100).optional(),
  equipamiento: z.array(equipamientoValido).optional(),
  activo: z.boolean().optional(),
  bloqueado: z.boolean().optional(),
  motivoBloqueo: z.string().max(200).nullable().optional(),
  posX: z.coerce.number().optional(),
  posY: z.coerce.number().optional(),
});

export const esquemaActualizarReglas = z.object({
  antelacionMaximaDias: z.coerce.number().int().min(1).max(365).optional(),
  duracionMaximaMinutos: z.coerce.number().int().min(15).max(1440).optional(),
  duracionMinimaMinutos: z.coerce.number().int().min(5).max(240).optional(),
  apertura: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
  cierre: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .optional(),
});

export const esquemaOcupacion = z.object({
  desde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});
