import { useIdioma } from "../i18n/contexto.js";
import type { EstadoEspacioPlano, EstadoReserva } from "../tipos.js";

const MAPA_PLANO: Record<EstadoEspacioPlano, string> = {
  libre: "etiqueta--libre",
  ocupado: "etiqueta--ocupado",
  bloqueado: "etiqueta--bloqueado",
  inactivo: "etiqueta--neutro",
};

export function EtiquetaEspacio({ estado }: { estado: EstadoEspacioPlano }) {
  const { t } = useIdioma();
  return <span className={`etiqueta ${MAPA_PLANO[estado]}`}>{t(`plano.leyenda.${estado === "inactivo" ? "bloqueado" : estado}`)}</span>;
}

const MAPA_RESERVA: Record<EstadoReserva, string> = {
  confirmada: "etiqueta--libre",
  cancelada: "etiqueta--neutro",
  no_presentada: "etiqueta--ocupado",
};

export function EtiquetaReserva({ estado }: { estado: EstadoReserva }) {
  const { t } = useIdioma();
  return <span className={`etiqueta ${MAPA_RESERVA[estado]}`}>{t(`estado.${estado}`)}</span>;
}
