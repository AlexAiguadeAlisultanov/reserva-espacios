import { ProveedorIdioma, useIdioma } from "./i18n/contexto.js";
import { ProveedorAuth, useAuth } from "./contexto/auth.js";
import { useRuta } from "./hooks/useRuta.js";
import { BarraSuperior } from "./componentes/BarraSuperior.js";
import { Login } from "./paginas/Login.js";
import { Plano } from "./paginas/Plano.js";
import { Agenda } from "./paginas/Agenda.js";
import { Busqueda } from "./paginas/Busqueda.js";
import { MisReservas } from "./paginas/MisReservas.js";
import { AdminEspacios } from "./paginas/admin/Espacios.js";
import { AdminReglas } from "./paginas/admin/Reglas.js";
import { AdminOcupacion } from "./paginas/admin/Ocupacion.js";

function SubNavAdmin({ ruta, navegar }: { ruta: string; navegar: (r: string) => void }) {
  const { t } = useIdioma();
  const enlaces = [
    { ruta: "/admin/espacios", etiqueta: t("nav.espacios") },
    { ruta: "/admin/reglas", etiqueta: t("nav.reglas") },
    { ruta: "/admin/ocupacion", etiqueta: t("nav.ocupacion") },
  ];
  return (
    <div className="contenedor" style={{ paddingTop: 16 }}>
      <div className="fila">
        {enlaces.map((e) => (
          <button key={e.ruta} className="nav-principal__enlace" data-activo={ruta === e.ruta} onClick={() => navegar(e.ruta)}>
            {e.etiqueta}
          </button>
        ))}
      </div>
    </div>
  );
}

function Aplicacion() {
  const { usuario, cargando } = useAuth();
  const [ruta, navegar] = useRuta();

  if (cargando) return null;
  if (!usuario) return <Login />;

  let pagina;
  if (ruta === "/agenda") pagina = <Agenda />;
  else if (ruta === "/busqueda") pagina = <Busqueda />;
  else if (ruta === "/mis-reservas") pagina = <MisReservas />;
  else if (ruta === "/admin/reglas" && usuario.rol === "admin") pagina = <AdminReglas />;
  else if (ruta === "/admin/ocupacion" && usuario.rol === "admin") pagina = <AdminOcupacion />;
  else if (ruta === "/admin/espacios" && usuario.rol === "admin") pagina = <AdminEspacios />;
  else pagina = <Plano />;

  return (
    <div className="app-shell">
      <BarraSuperior ruta={ruta} navegar={navegar} />
      {ruta.startsWith("/admin") && usuario.rol === "admin" && <SubNavAdmin ruta={ruta} navegar={navegar} />}
      {pagina}
    </div>
  );
}

export default function App() {
  return (
    <ProveedorIdioma>
      <ProveedorAuth>
        <Aplicacion />
      </ProveedorAuth>
    </ProveedorIdioma>
  );
}
