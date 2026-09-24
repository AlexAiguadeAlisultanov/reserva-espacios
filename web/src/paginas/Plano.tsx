import { useEffect, useMemo, useState } from "react";
import { useIdioma } from "../i18n/contexto.js";
import { espaciosApi } from "../api/servicios.js";
import { ModalReserva } from "../componentes/ModalReserva.js";
import { opcionesHora } from "../utilidades/franjas.js";
import { aInstanteMadrid, fechaLocalMadrid, sumarMinutosAHora } from "../utilidades/tiempo.js";
import type { Espacio, EspacioConEstado } from "../tipos.js";

const VIEWBOX = "0 0 900 600";
const DURACIONES = [30, 60, 90, 120];

export function Plano() {
  const { t } = useIdioma();
  const [planta, setPlanta] = useState(1);
  const [fecha, setFecha] = useState(() => fechaLocalMadrid());
  const [horaInicio, setHoraInicio] = useState("09:00");
  const [duracion, setDuracion] = useState(30);
  const [espacios, setEspacios] = useState<EspacioConEstado[]>([]);
  const [cargando, setCargando] = useState(true);
  const [seleccionado, setSeleccionado] = useState<Espacio | null>(null);

  const horaFin = sumarMinutosAHora(horaInicio, duracion);
  const opciones = opcionesHora();

  async function cargar() {
    setCargando(true);
    try {
      const inicioIso = aInstanteMadrid(`${fecha}T${horaInicio}`).toISOString();
      const finIso = aInstanteMadrid(`${fecha}T${horaFin}`).toISOString();
      const datos = await espaciosApi.disponibilidad(inicioIso, finIso, planta);
      setEspacios(datos);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planta, fecha, horaInicio, duracion]);

  const salas = useMemo(() => espacios.filter((e) => e.tipo === "sala"), [espacios]);
  const puestos = useMemo(() => espacios.filter((e) => e.tipo === "puesto"), [espacios]);

  return (
    <div className="contenido">
      <div className="contenedor pila entrada">
        <div>
          <h1 className="titulo-pagina">{t("plano.titulo")}</h1>
        </div>

        <div className="fila">
          <div className="fila" role="tablist" aria-label={t("plano.titulo")}>
            {[1, 2].map((p) => (
              <button
                key={p}
                className="nav-principal__enlace"
                data-activo={planta === p}
                style={{ background: planta === p ? "var(--acento-suave)" : "var(--panel)" }}
                onClick={() => setPlanta(p)}
              >
                {t(`planta.${p}`)}
              </button>
            ))}
          </div>

          <label className="campo" style={{ width: 160 }}>
            <span className="campo__etiqueta">{t("plano.fecha")}</span>
            <input className="campo__control" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
          <label className="campo" style={{ width: 120 }}>
            <span className="campo__etiqueta">{t("plano.desde")}</span>
            <select className="campo__control" value={horaInicio} onChange={(e) => setHoraInicio(e.target.value)}>
              {opciones.map((h) => (
                <option key={h} value={h}>
                  {h}
                </option>
              ))}
            </select>
          </label>
          <label className="campo" style={{ width: 130 }}>
            <span className="campo__etiqueta">{t("plano.duracion")}</span>
            <select className="campo__control" value={duracion} onChange={(e) => setDuracion(Number(e.target.value))}>
              {DURACIONES.map((d) => (
                <option key={d} value={d}>
                  {t(`duracion.${d}`)}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="plano-envoltorio">
          {espacios.length === 0 && !cargando ? (
            <p className="estado-vacio">{t("plano.sinEspacios")}</p>
          ) : (
            <svg className="plano-svg" viewBox={VIEWBOX} role="img" aria-label={t(`planta.${planta}`)}>
              {[...salas, ...puestos].map((espacio) => (
                <g
                  key={espacio.id}
                  className="plano-espacio"
                  data-estado={espacio.estado}
                  data-interactivo={espacio.estado === "libre"}
                  transform={`translate(${espacio.posX}, ${espacio.posY})`}
                  onClick={() => espacio.estado === "libre" && setSeleccionado(espacio)}
                >
                  <title>
                    {espacio.estado === "ocupado" && espacio.ocupadoPor
                      ? t("plano.ocupadoPor", { nombre: espacio.ocupadoPor, hora: espacio.ocupadoHasta ?? "" })
                      : espacio.nombre}
                  </title>
                  <rect className="plano-espacio__forma" width={espacio.ancho} height={espacio.alto} rx={espacio.tipo === "sala" ? 12 : 8} />
                  <text className="plano-espacio__texto" x={8} y={espacio.tipo === "sala" ? 20 : 18}>
                    {espacio.nombre}
                  </text>
                  {espacio.tipo === "sala" && (
                    <text className="plano-espacio__subtexto" x={8} y={36}>
                      {t("plano.capacidad", { n: espacio.capacidad })}
                    </text>
                  )}
                </g>
              ))}
            </svg>
          )}
          <div className="plano-leyenda">
            <span className="plano-leyenda__item">
              <span className="plano-leyenda__punto" style={{ background: "rgba(79,165,122,0.6)" }} />
              {t("plano.leyenda.libre")}
            </span>
            <span className="plano-leyenda__item">
              <span className="plano-leyenda__punto" style={{ background: "rgba(201,98,87,0.6)" }} />
              {t("plano.leyenda.ocupado")}
            </span>
            <span className="plano-leyenda__item">
              <span className="plano-leyenda__punto" style={{ background: "rgba(201,154,69,0.5)" }} />
              {t("plano.leyenda.bloqueado")}
            </span>
          </div>
        </div>
      </div>

      {seleccionado && (
        <ModalReserva
          espacio={seleccionado}
          fechaInicial={fecha}
          horaInicioInicial={horaInicio}
          horaFinInicial={horaFin}
          onCerrar={() => setSeleccionado(null)}
          onReservado={cargar}
        />
      )}
    </div>
  );
}
