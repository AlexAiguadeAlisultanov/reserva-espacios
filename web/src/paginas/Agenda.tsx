import { useEffect, useState } from "react";
import { useIdioma } from "../i18n/contexto.js";
import { espaciosApi } from "../api/servicios.js";
import { ModalReserva } from "../componentes/ModalReserva.js";
import { fechaLocalMadrid, horaLocalMadrid } from "../utilidades/tiempo.js";
import type { Espacio, FranjaAgenda } from "../tipos.js";

export function Agenda() {
  const { t } = useIdioma();
  const [espacios, setEspacios] = useState<Espacio[]>([]);
  const [espacioId, setEspacioId] = useState<string>("");
  const [fecha, setFecha] = useState(() => fechaLocalMadrid());
  const [franjas, setFranjas] = useState<FranjaAgenda[]>([]);
  const [cargando, setCargando] = useState(true);
  const [franjaElegida, setFranjaElegida] = useState<FranjaAgenda | null>(null);

  useEffect(() => {
    espaciosApi.listar().then((lista) => {
      setEspacios(lista);
      if (lista.length > 0 && !espacioId) setEspacioId(lista[0]!.id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function cargar() {
    if (!espacioId) return;
    setCargando(true);
    try {
      const datos = await espaciosApi.agenda(espacioId, fecha);
      setFranjas(datos);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [espacioId, fecha]);

  const espacio = espacios.find((e) => e.id === espacioId) ?? null;

  return (
    <div className="contenido">
      <div className="contenedor pila entrada">
        <h1 className="titulo-pagina">{t("agenda.titulo")}</h1>

        <div className="fila">
          <label className="campo" style={{ minWidth: 220 }}>
            <span className="campo__etiqueta">{t("agenda.espacio")}</span>
            <select className="campo__control" value={espacioId} onChange={(e) => setEspacioId(e.target.value)}>
              {espacios.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} — {t(`planta.${e.planta}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="campo" style={{ width: 170 }}>
            <span className="campo__etiqueta">{t("agenda.fecha")}</span>
            <input className="campo__control" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
          </label>
        </div>

        {!cargando && (
          <div className="lista-franjas">
            {franjas.map((f) => (
              <button
                key={f.inicio}
                className="franja"
                data-estado={f.estado}
                onClick={() => f.estado === "libre" && setFranjaElegida(f)}
                disabled={f.estado !== "libre"}
              >
                <strong>{horaLocalMadrid(f.inicio)}</strong>
                <div className="texto-atenuado">{f.estado === "libre" ? t("agenda.libre") : f.usuarioNombre}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {franjaElegida && espacio && (
        <ModalReserva
          espacio={espacio}
          fechaInicial={fecha}
          horaInicioInicial={horaLocalMadrid(franjaElegida.inicio)}
          horaFinInicial={horaLocalMadrid(franjaElegida.fin)}
          onCerrar={() => setFranjaElegida(null)}
          onReservado={cargar}
        />
      )}
    </div>
  );
}
