import { useState } from "react";
import { useIdioma } from "../i18n/contexto.js";
import { useAuth } from "../contexto/auth.js";
import { IDIOMAS } from "../i18n/diccionario.js";

const CONTRASENA_DEMO = "prova1234";

export function Login() {
  const { t, idioma, cambiarIdioma } = useIdioma();
  const { entrar } = useAuth();
  const [email, setEmail] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setError(false);
    setEnviando(true);
    try {
      await entrar(email, contrasena);
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  async function entrarComo(correo: string) {
    setError(false);
    setEmail(correo);
    setContrasena(CONTRASENA_DEMO);
    setEnviando(true);
    try {
      await entrar(correo, CONTRASENA_DEMO);
    } catch {
      setError(true);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="contenido">
      <div className="contenedor contenido--estrecho entrada">
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 24 }}>
          <select className="entrada-texto" style={{ width: "auto" }} value={idioma} onChange={(e) => cambiarIdioma(e.target.value as typeof idioma)}>
            {IDIOMAS.map((i) => (
              <option key={i.codigo} value={i.codigo}>
                {i.etiqueta}
              </option>
            ))}
          </select>
        </div>

        <h1 className="titulo-pagina">{t("login.titulo")}</h1>
        <p className="subtitulo-pagina" style={{ marginBottom: 32 }}>
          {t("login.subtitulo")}
        </p>

        <form className="tarjeta pila" onSubmit={enviar}>
          <label className="campo">
            <span className="campo__etiqueta">{t("login.email")}</span>
            <input
              className="campo__control"
              type="email"
              required
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="campo">
            <span className="campo__etiqueta">{t("login.contrasena")}</span>
            <input
              className="campo__control"
              type="password"
              required
              autoComplete="current-password"
              value={contrasena}
              onChange={(e) => setContrasena(e.target.value)}
            />
          </label>
          {error && <div className="aviso-inline aviso-inline--error">{t("login.error")}</div>}
          <button className="boton boton--primario boton--ancho" type="submit" disabled={enviando}>
            {enviando ? t("login.entrando") : t("login.entrar")}
          </button>
        </form>

        <div className="pila pila--pequena" style={{ marginTop: 32 }}>
          <span className="campo__etiqueta">{t("login.demo")}</span>
          <button className="boton boton--secundario boton--ancho" onClick={() => entrarComo("nuria@empresa.test")} disabled={enviando}>
            {t("login.demoEmpleada")}
          </button>
          <button className="boton boton--secundario boton--ancho" onClick={() => entrarComo("pau@empresa.test")} disabled={enviando}>
            {t("login.demoEmpleado")}
          </button>
          <button className="boton boton--secundario boton--ancho" onClick={() => entrarComo("oficina@empresa.test")} disabled={enviando}>
            {t("login.demoAdmin")}
          </button>
        </div>
      </div>
    </div>
  );
}
