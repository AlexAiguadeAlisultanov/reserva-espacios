import { useEffect, useState } from "react";
import { useIdioma } from "../../i18n/contexto.js";
import { adminApi } from "../../api/servicios.js";
import { fechaLocalMadrid, fechaMasDias } from "../../utilidades/tiempo.js";
import type { PanelOcupacion } from "../../tipos.js";

export function AdminOcupacion() {
  const { t } = useIdioma();
  const [desde, setDesde] = useState(() => fechaMasDias(fechaLocalMadrid(), -7));
  const [hasta, setHasta] = useState(() => fechaLocalMadrid());
  const [panel, setPanel] = useState<PanelOcupacion | null>(null);
  const [cargando, setCargando] = useState(true);

  async function cargar() {
    setCargando(true);
    try {
      setPanel(await adminApi.ocupacion(desde, hasta));
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desde, hasta]);

  return (
    <div className="contenido">
      <div className="contenedor pila entrada">
        <h1 className="titulo-pagina">{t("admin.ocupacion.titulo")}</h1>

        <div className="fila">
          <label className="campo" style={{ width: 170 }}>
            <span className="campo__etiqueta">{t("admin.ocupacion.desde")}</span>
            <input className="campo__control" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
          </label>
          <label className="campo" style={{ width: 170 }}>
            <span className="campo__etiqueta">{t("admin.ocupacion.hasta")}</span>
            <input className="campo__control" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
          </label>
        </div>

        {!cargando && panel && (
          <>
            <div className="tarjeta">
              <span className="campo__etiqueta">{t("admin.ocupacion.noPresentadas")}</span>
              <p style={{ fontSize: "2rem", fontWeight: 700, margin: "4px 0 0" }}>{panel.totalNoPresentadas}</p>
            </div>

            <div className="tarjeta pila">
              <span className="campo__etiqueta">{t("admin.ocupacion.porEspacio")}</span>
              {panel.porEspacio.map((e) => (
                <div key={e.espacioId} className="pila pila--pequena">
                  <div className="fila fila--entre texto-pequeno">
                    <span>{e.nombre}</span>
                    <span className="texto-atenuado">
                      {e.porcentaje}% {e.noPresentadas > 0 && `· ${e.noPresentadas} no presentadas`}
                    </span>
                  </div>
                  <div className="barra-progreso">
                    <div className="barra-progreso__relleno" style={{ width: `${e.porcentaje}%` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="tarjeta pila">
              <span className="campo__etiqueta">{t("admin.ocupacion.porDia")}</span>
              {panel.porDiaSemana.map((d) => (
                <div key={d.dia} className="pila pila--pequena">
                  <div className="fila fila--entre texto-pequeno">
                    <span>{t(`dia.${d.dia}`)}</span>
                    <span className="texto-atenuado">{d.porcentaje}%</span>
                  </div>
                  <div className="barra-progreso">
                    <div className="barra-progreso__relleno" style={{ width: `${d.porcentaje}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
