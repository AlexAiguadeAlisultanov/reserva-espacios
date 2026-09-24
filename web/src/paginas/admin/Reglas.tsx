import { useEffect, useState } from "react";
import { useIdioma } from "../../i18n/contexto.js";
import { adminApi } from "../../api/servicios.js";
import type { ReglasOficina } from "../../tipos.js";

export function AdminReglas() {
  const { t } = useIdioma();
  const [reglas, setReglas] = useState<ReglasOficina | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado] = useState(false);

  useEffect(() => {
    adminApi.reglas().then(setReglas);
  }, []);

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!reglas) return;
    setGuardando(true);
    setGuardado(false);
    try {
      const actualizadas = await adminApi.actualizarReglas(reglas);
      setReglas(actualizadas);
      setGuardado(true);
    } finally {
      setGuardando(false);
    }
  }

  if (!reglas) return null;

  return (
    <div className="contenido">
      <div className="contenedor contenido--estrecho entrada">
        <h1 className="titulo-pagina">{t("admin.reglas.titulo")}</h1>

        <form className="tarjeta pila" onSubmit={guardar}>
          <div className="fila-campos">
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.reglas.antelacion")}</span>
              <input
                className="campo__control"
                type="number"
                min={1}
                value={reglas.antelacionMaximaDias}
                onChange={(e) => setReglas({ ...reglas, antelacionMaximaDias: Number(e.target.value) })}
              />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.reglas.duracionMinima")}</span>
              <input
                className="campo__control"
                type="number"
                min={5}
                value={reglas.duracionMinimaMinutos}
                onChange={(e) => setReglas({ ...reglas, duracionMinimaMinutos: Number(e.target.value) })}
              />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.reglas.duracionMaxima")}</span>
              <input
                className="campo__control"
                type="number"
                min={15}
                value={reglas.duracionMaximaMinutos}
                onChange={(e) => setReglas({ ...reglas, duracionMaximaMinutos: Number(e.target.value) })}
              />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.reglas.apertura")}</span>
              <input className="campo__control" type="time" value={reglas.apertura} onChange={(e) => setReglas({ ...reglas, apertura: e.target.value })} />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.reglas.cierre")}</span>
              <input className="campo__control" type="time" value={reglas.cierre} onChange={(e) => setReglas({ ...reglas, cierre: e.target.value })} />
            </label>
          </div>

          {guardado && <div className="aviso-inline aviso-inline--exito">{t("admin.reglas.guardado")}</div>}

          <button className="boton boton--primario" type="submit" disabled={guardando} style={{ alignSelf: "flex-start" }}>
            {guardando ? t("comun.guardando") : t("admin.reglas.guardar")}
          </button>
        </form>
      </div>
    </div>
  );
}
