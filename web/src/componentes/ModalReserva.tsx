import { useState } from "react";
import { Modal } from "./Modal.js";
import { Casilla } from "./Casilla.js";
import { useIdioma } from "../i18n/contexto.js";
import { reservasApi } from "../api/servicios.js";
import { ErrorApi } from "../api/cliente.js";
import { opcionesHora } from "../utilidades/franjas.js";
import { aInstanteMadrid } from "../utilidades/tiempo.js";
import type { Espacio } from "../tipos.js";

interface Props {
  espacio: Espacio;
  fechaInicial: string;
  horaInicioInicial: string;
  horaFinInicial: string;
  onCerrar: () => void;
  onReservado: () => void;
}

const ETIQUETAS_EQUIPAMIENTO: Record<string, string> = {
  pantalla: "equipamiento.pantalla",
  videoconferencia: "equipamiento.videoconferencia",
  pizarra: "equipamiento.pizarra",
};

export function ModalReserva({ espacio, fechaInicial, horaInicioInicial, horaFinInicial, onCerrar, onReservado }: Props) {
  const { t } = useIdioma();
  const [fecha, setFecha] = useState(fechaInicial);
  const [horaInicio, setHoraInicio] = useState(horaInicioInicial);
  const [horaFin, setHoraFin] = useState(horaFinInicial);
  const [recurrente, setRecurrente] = useState(false);
  const [hastaFecha, setHastaFecha] = useState(fechaInicial);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const opciones = opcionesHora();

  async function confirmar() {
    setError(null);
    setEnviando(true);
    try {
      const inicioIso = aInstanteMadrid(`${fecha}T${horaInicio}`).toISOString();
      const finIso = aInstanteMadrid(`${fecha}T${horaFin}`).toISOString();
      const respuesta = await reservasApi.crear({
        espacioId: espacio.id,
        inicio: inicioIso,
        fin: finIso,
        recurrente: recurrente ? { hasta: aInstanteMadrid(`${hastaFecha}T23:59`).toISOString() } : undefined,
      });
      if (respuesta.reservas) {
        setExito(t("reserva.exitoSerie", { n: respuesta.reservas.length }));
      } else {
        setExito(t("reserva.exito"));
      }
      onReservado();
      setTimeout(onCerrar, 900);
    } catch (err) {
      if (err instanceof ErrorApi) {
        setError(t(`error.${err.motivo}`) !== `error.${err.motivo}` ? t(`error.${err.motivo}`) : t("error.generico"));
      } else {
        setError(t("error.generico"));
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Modal titulo={t("reserva.titulo", { nombre: espacio.nombre })} onCerrar={onCerrar}>
      <div className="pila">
        <div className="fila texto-pequeno texto-atenuado">
          <span>{t("reserva.capacidad", { n: espacio.capacidad })}</span>
        </div>
        {espacio.equipamiento.length > 0 && (
          <div className="fila">
            {espacio.equipamiento.map((eq) => (
              <span key={eq} className="etiqueta etiqueta--neutro">
                {t(ETIQUETAS_EQUIPAMIENTO[eq] ?? eq)}
              </span>
            ))}
          </div>
        )}

        <div className="fila-campos">
          <label className="campo">
            <span className="campo__etiqueta">{t("reserva.fecha")}</span>
            <input className="campo__control" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">{t("reserva.inicio")}</span>
            <select className="campo__control" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}>
              {opciones.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="campo">
            <span className="campo__etiqueta">{t("reserva.fin")}</span>
            <select className="campo__control" value={horaFin} onChange={(e) => setHoraFin(e.target.value)}>
              {opciones
                .filter((h) => h > horaInicio)
                .map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <Casilla marcada={recurrente} onClick={() => setRecurrente((v) => !v)}>
          {t("reserva.recurrente")}
        </Casilla>

        {recurrente && (
          <label className="campo">
            <span className="campo__etiqueta">{t("reserva.recurrenteHasta")}</span>
            <input className="campo__control" type="date" min={fecha} value={hastaFecha} onChange={(e) => setHastaFecha(e.target.value)} />
          </label>
        )}

        {error && <div className="aviso-inline aviso-inline--error">{error}</div>}
        {exito && <div className="aviso-inline aviso-inline--exito">{exito}</div>}

        <button className="boton boton--primario boton--ancho" onClick={confirmar} disabled={enviando || !!exito}>
          {enviando ? t("reserva.confirmando") : t("reserva.confirmar")}
        </button>
      </div>
    </Modal>
  );
}
