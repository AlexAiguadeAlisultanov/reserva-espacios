import { useState } from "react";
import { Users, ScreenShare, Video, PenSquare } from "lucide-react";
import { useIdioma } from "../i18n/contexto.js";
import { espaciosApi } from "../api/servicios.js";
import { ModalReserva } from "../componentes/ModalReserva.js";
import { opcionesHora } from "../utilidades/franjas.js";
import { aInstanteMadrid, fechaLocalMadrid } from "../utilidades/tiempo.js";
import type { Equipamiento, Espacio, TipoEspacio } from "../tipos.js";

const OPCIONES_EQUIPAMIENTO: { valor: Equipamiento; icono: typeof ScreenShare }[] = [
  { valor: "pantalla", icono: ScreenShare },
  { valor: "videoconferencia", icono: Video },
  { valor: "pizarra", icono: PenSquare },
];

export function Busqueda() {
  const { t } = useIdioma();
  const [fecha, setFecha] = useState(() => fechaLocalMadrid());
  const [horaInicio, setHoraInicio] = useState("10:00");
  const [horaFin, setHoraFin] = useState("11:00");
  const [tipo, setTipo] = useState<TipoEspacio | "">("");
  const [capacidadMinima, setCapacidadMinima] = useState<number | "">("");
  const [equipamiento, setEquipamiento] = useState<Equipamiento[]>([]);
  const [resultados, setResultados] = useState<Espacio[] | null>(null);
  const [buscando, setBuscando] = useState(false);
  const [seleccionado, setSeleccionado] = useState<Espacio | null>(null);

  const opciones = opcionesHora();

  function alternarEquipamiento(valor: Equipamiento) {
    setEquipamiento((actual) => (actual.includes(valor) ? actual.filter((e) => e !== valor) : [...actual, valor]));
  }

  async function buscar(e: React.FormEvent) {
    e.preventDefault();
    setBuscando(true);
    try {
      const inicioIso = aInstanteMadrid(`${fecha}T${horaInicio}`).toISOString();
      const finIso = aInstanteMadrid(`${fecha}T${horaFin}`).toISOString();
      const datos = await espaciosApi.busqueda({
        inicio: inicioIso,
        fin: finIso,
        tipo: tipo || undefined,
        capacidadMinima: capacidadMinima === "" ? undefined : capacidadMinima,
        equipamiento,
      });
      setResultados(datos);
    } finally {
      setBuscando(false);
    }
  }

  return (
    <div className="contenido">
      <div className="contenedor pila entrada">
        <div>
          <h1 className="titulo-pagina">{t("busqueda.titulo")}</h1>
          <p className="subtitulo-pagina">{t("busqueda.subtitulo")}</p>
        </div>

        <form className="tarjeta pila" onSubmit={buscar}>
          <div className="fila-campos">
            <label className="campo">
              <span className="campo__etiqueta">{t("busqueda.fecha")}</span>
              <input className="campo__control" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("busqueda.inicio")}</span>
              <select className="campo__control" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}>
                {opciones.map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("busqueda.fin")}</span>
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
            <label className="campo">
              <span className="campo__etiqueta">{t("busqueda.tipo")}</span>
              <select className="campo__control" value={tipo} onChange={(e) => setTipo(e.target.value as TipoEspacio | "")}>
                <option value="">{t("busqueda.tipoTodos")}</option>
                <option value="sala">{t("busqueda.tipoSala")}</option>
                <option value="puesto">{t("busqueda.tipoPuesto")}</option>
              </select>
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("busqueda.capacidad")}</span>
              <input
                className="campo__control"
                type="number"
                min={1}
                value={capacidadMinima}
                onChange={(e) => setCapacidadMinima(e.target.value === "" ? "" : Number(e.target.value))}
              />
            </label>
          </div>

          <div className="campo">
            <span className="campo__etiqueta">{t("busqueda.equipamiento")}</span>
            <div className="fila">
              {OPCIONES_EQUIPAMIENTO.map(({ valor, icono: Icono }) => (
                <button
                  key={valor}
                  type="button"
                  className="casilla"
                  data-marcada={equipamiento.includes(valor)}
                  onClick={() => alternarEquipamiento(valor)}
                >
                  <Icono size={14} />
                  {t(`equipamiento.${valor}`)}
                </button>
              ))}
            </div>
          </div>

          <button className="boton boton--primario" type="submit" disabled={buscando} style={{ alignSelf: "flex-start" }}>
            {buscando ? t("busqueda.buscando") : t("busqueda.buscar")}
          </button>
        </form>

        {resultados && (
          <div className="pila">
            <span className="campo__etiqueta">{t("busqueda.resultados", { n: resultados.length })}</span>
            {resultados.length === 0 ? (
              <p className="estado-vacio">{t("busqueda.sinResultados")}</p>
            ) : (
              <div className="fila-campos" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
                {resultados.map((espacio) => (
                  <div key={espacio.id} className="tarjeta pila pila--pequena">
                    <strong>{espacio.nombre}</strong>
                    <span className="texto-atenuado texto-pequeno">
                      {t(`planta.${espacio.planta}`)} · <Users size={12} style={{ verticalAlign: "-2px" }} /> {espacio.capacidad}
                    </span>
                    {espacio.equipamiento.length > 0 && (
                      <div className="fila">
                        {espacio.equipamiento.map((eq) => (
                          <span key={eq} className="etiqueta etiqueta--neutro">
                            {t(`equipamiento.${eq}`)}
                          </span>
                        ))}
                      </div>
                    )}
                    <button className="boton boton--primario-contorno" style={{ marginTop: "auto" }} onClick={() => setSeleccionado(espacio)}>
                      {t("reserva.confirmar")}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {seleccionado && (
        <ModalReserva
          espacio={seleccionado}
          fechaInicial={fecha}
          horaInicioInicial={horaInicio}
          horaFinInicial={horaFin}
          onCerrar={() => setSeleccionado(null)}
          onReservado={() => setResultados((r) => r?.filter((e) => e.id !== seleccionado.id) ?? r)}
        />
      )}
    </div>
  );
}
