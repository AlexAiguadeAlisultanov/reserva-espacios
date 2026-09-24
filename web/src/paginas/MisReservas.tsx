import { useEffect, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import { useIdioma } from "../i18n/contexto.js";
import { reservasApi } from "../api/servicios.js";
import { EtiquetaReserva } from "../componentes/EtiquetaEstado.js";
import { formatearImporteFecha } from "../utilidades/tiempo.js";
import type { ReservaConEspacio } from "../tipos.js";

export function MisReservas() {
  const { t, idioma } = useIdioma();
  const [reservas, setReservas] = useState<ReservaConEspacio[]>([]);
  const [cargando, setCargando] = useState(true);
  const [confirmando, setConfirmando] = useState<{ id: string; serie: boolean } | null>(null);

  async function cargar() {
    setCargando(true);
    try {
      setReservas(await reservasApi.mias());
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    cargar();
  }, []);

  async function hacerCheckin(id: string) {
    await reservasApi.checkin(id);
    cargar();
  }

  async function cancelar(id: string, serie: boolean) {
    await reservasApi.cancelar(id, serie);
    setConfirmando(null);
    cargar();
  }

  const ahora = Date.now();
  const proximas = reservas.filter((r) => r.estado === "confirmada" && new Date(r.fin).getTime() >= ahora);
  const pasadas = reservas.filter((r) => !(r.estado === "confirmada" && new Date(r.fin).getTime() >= ahora));

  function tarjetaReserva(r: ReservaConEspacio) {
    return (
      <div key={r.id} className="tarjeta pila pila--pequena">
        <div className="fila fila--entre">
          <strong>{r.espacioNombre}</strong>
          <EtiquetaReserva estado={r.estado} />
        </div>
        <span className="texto-atenuado texto-pequeno">
          {formatearImporteFecha(r.inicio, idioma)} — {formatearImporteFecha(r.fin, idioma).split(", ")[1]}
        </span>
        {r.estado === "confirmada" && !r.checkinEn && new Date(r.inicio).getTime() <= ahora && (
          <p className="aviso-inline aviso-inline--error" style={{ margin: 0 }}>
            {t("misReservas.avisoCheckin")}
          </p>
        )}
        <div className="fila">
          {r.puedeHacerCheckin && (
            <button className="boton boton--primario boton--pequeno" onClick={() => hacerCheckin(r.id)}>
              <CheckCircle2 size={14} /> {t("misReservas.checkin")}
            </button>
          )}
          {r.checkinEn && r.estado === "confirmada" && (
            <span className="etiqueta etiqueta--libre">
              <CheckCircle2 size={12} /> {t("misReservas.checkinHecho")}
            </span>
          )}
          {r.estado === "confirmada" && (
            <>
              <button className="boton boton--peligro boton--pequeno" onClick={() => setConfirmando({ id: r.id, serie: false })}>
                {t("misReservas.cancelar")}
              </button>
              {r.recurrenciaId && (
                <button className="boton boton--fantasma boton--pequeno" onClick={() => setConfirmando({ id: r.id, serie: true })}>
                  {t("misReservas.cancelarSerie")}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="contenido">
      <div className="contenedor pila entrada">
        <h1 className="titulo-pagina">{t("misReservas.titulo")}</h1>

        {!cargando && reservas.length === 0 && <p className="estado-vacio">{t("misReservas.vacio")}</p>}

        {proximas.length > 0 && (
          <div className="pila pila--pequena">
            <span className="campo__etiqueta">{t("misReservas.proximas")}</span>
            <div className="fila-campos" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {proximas.map(tarjetaReserva)}
            </div>
          </div>
        )}

        {pasadas.length > 0 && (
          <div className="pila pila--pequena">
            <span className="campo__etiqueta">{t("misReservas.pasadas")}</span>
            <div className="fila-campos" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
              {pasadas.map(tarjetaReserva)}
            </div>
          </div>
        )}
      </div>

      {confirmando && (
        <div className="velo-modal" onClick={() => setConfirmando(null)}>
          <div className="panel-modal entrada" style={{ maxWidth: 360 }} onClick={(e) => e.stopPropagation()}>
            <p style={{ marginBottom: 16 }}>{confirmando.serie ? t("misReservas.confirmarCancelarSerie") : t("misReservas.confirmarCancelar")}</p>
            <div className="fila">
              <button className="boton boton--peligro" onClick={() => cancelar(confirmando.id, confirmando.serie)}>
                {t("comun.si")}
              </button>
              <button className="boton boton--secundario" onClick={() => setConfirmando(null)}>
                {t("comun.no")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
