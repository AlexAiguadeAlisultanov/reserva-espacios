import { LayoutGrid, CalendarClock, Search, ListChecks, Settings, LogOut } from "lucide-react";
import { useIdioma } from "../i18n/contexto.js";
import { useAuth } from "../contexto/auth.js";
import { IDIOMAS } from "../i18n/diccionario.js";

interface Props {
  ruta: string;
  navegar: (ruta: string) => void;
}

export function BarraSuperior({ ruta, navegar }: Props) {
  const { t, idioma, cambiarIdioma } = useIdioma();
  const { usuario, salir } = useAuth();

  const enlaces = [
    { ruta: "/plano", etiqueta: t("nav.plano"), icono: LayoutGrid },
    { ruta: "/agenda", etiqueta: t("nav.agenda"), icono: CalendarClock },
    { ruta: "/busqueda", etiqueta: t("nav.busqueda"), icono: Search },
    { ruta: "/mis-reservas", etiqueta: t("nav.misReservas"), icono: ListChecks },
  ];
  if (usuario?.rol === "admin") {
    enlaces.push({ ruta: "/admin/espacios", etiqueta: t("nav.admin"), icono: Settings });
  }

  function estaActivo(rutaEnlace: string): boolean {
    if (rutaEnlace === "/admin/espacios") return ruta.startsWith("/admin");
    return ruta === rutaEnlace;
  }

  return (
    <header className="barra-superior">
      <div className="contenedor barra-superior__interior">
        <span className="marca">
          <span className="marca__punto" aria-hidden="true" />
          {t("app.nombre")}
        </span>
        <nav className="nav-principal" aria-label={t("app.nombre")}>
          {enlaces.map(({ ruta: r, etiqueta, icono: Icono }) => (
            <button key={r} className="nav-principal__enlace" data-activo={estaActivo(r)} onClick={() => navegar(r)}>
              <Icono size={15} />
              {etiqueta}
            </button>
          ))}
        </nav>
        <div className="barra-superior__extra">
          <select
            className="entrada-texto"
            style={{ width: "auto", padding: "6px 8px" }}
            value={idioma}
            onChange={(e) => cambiarIdioma(e.target.value as typeof idioma)}
            aria-label="Idioma"
          >
            {IDIOMAS.map((i) => (
              <option key={i.codigo} value={i.codigo}>
                {i.etiqueta}
              </option>
            ))}
          </select>
          {usuario && (
            <button className="boton boton--fantasma" onClick={() => salir()} title={t("nav.salir")}>
              <LogOut size={16} />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
