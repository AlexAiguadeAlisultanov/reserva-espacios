import { useEffect, useState } from "react";
import { DoorOpen, Monitor } from "lucide-react";
import { useIdioma } from "../../i18n/contexto.js";
import { adminApi } from "../../api/servicios.js";
import { Casilla } from "../../componentes/Casilla.js";
import type { Equipamiento, Espacio, TipoEspacio } from "../../tipos.js";

const TODO_EQUIPAMIENTO: Equipamiento[] = ["pantalla", "videoconferencia", "pizarra"];

function EditorEspacio({ espacio, onGuardado }: { espacio: Espacio; onGuardado: () => void }) {
  const { t } = useIdioma();
  const [abierto, setAbierto] = useState(false);
  const [nombre, setNombre] = useState(espacio.nombre);
  const [capacidad, setCapacidad] = useState(espacio.capacidad);
  const [equipamiento, setEquipamiento] = useState<Equipamiento[]>(espacio.equipamiento);
  const [bloqueado, setBloqueado] = useState(espacio.bloqueado);
  const [motivo, setMotivo] = useState(espacio.motivoBloqueo ?? "");
  const [guardando, setGuardando] = useState(false);

  function alternar(valor: Equipamiento) {
    setEquipamiento((actual) => (actual.includes(valor) ? actual.filter((e) => e !== valor) : [...actual, valor]));
  }

  async function guardar() {
    setGuardando(true);
    try {
      await adminApi.actualizarEspacio(espacio.id, {
        nombre,
        capacidad,
        equipamiento,
        bloqueado,
        motivoBloqueo: bloqueado ? motivo || null : null,
      });
      setAbierto(false);
      onGuardado();
    } finally {
      setGuardando(false);
    }
  }

  async function darDeBaja() {
    await adminApi.darDeBaja(espacio.id);
    onGuardado();
  }

  if (!abierto) {
    return (
      <tr>
        <td className="fila" style={{ gap: 8 }}>
          {espacio.tipo === "sala" ? <DoorOpen size={14} /> : <Monitor size={14} />} {espacio.nombre}
        </td>
        <td>{t(`planta.${espacio.planta}`)}</td>
        <td>{espacio.capacidad}</td>
        <td>{espacio.equipamiento.map((e) => t(`equipamiento.${e}`)).join(", ") || "—"}</td>
        <td>
          {espacio.bloqueado ? (
            <span className="etiqueta etiqueta--bloqueado">{t("admin.espacios.bloqueado")}</span>
          ) : espacio.activo ? (
            <span className="etiqueta etiqueta--libre">{t("admin.espacios.activo")}</span>
          ) : (
            <span className="etiqueta etiqueta--neutro">{t("admin.espacios.dadoDeBaja")}</span>
          )}
        </td>
        <td className="fila">
          <button className="boton boton--secundario boton--pequeno" onClick={() => setAbierto(true)}>
            {t("admin.espacios.guardar")}
          </button>
          {espacio.activo && (
            <button className="boton boton--peligro boton--pequeno" onClick={darDeBaja}>
              {t("admin.espacios.dadoDeBaja")}
            </button>
          )}
        </td>
      </tr>
    );
  }

  return (
    <tr>
      <td colSpan={6}>
        <div className="tarjeta pila pila--pequena">
          <div className="fila-campos">
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.espacios.nombre")}</span>
              <input className="campo__control" value={nombre} onChange={(e) => setNombre(e.target.value)} />
            </label>
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.espacios.capacidad")}</span>
              <input className="campo__control" type="number" min={1} value={capacidad} onChange={(e) => setCapacidad(Number(e.target.value))} />
            </label>
          </div>
          {espacio.tipo === "sala" && (
            <div className="fila">
              {TODO_EQUIPAMIENTO.map((eq) => (
                <button key={eq} type="button" className="casilla" data-marcada={equipamiento.includes(eq)} onClick={() => alternar(eq)}>
                  {t(`equipamiento.${eq}`)}
                </button>
              ))}
            </div>
          )}
          <Casilla marcada={bloqueado} onClick={() => setBloqueado((v) => !v)}>
            {t("admin.espacios.bloqueado")}
          </Casilla>
          {bloqueado && (
            <label className="campo">
              <span className="campo__etiqueta">{t("admin.espacios.motivo")}</span>
              <input className="campo__control" value={motivo} onChange={(e) => setMotivo(e.target.value)} />
            </label>
          )}
          <div className="fila">
            <button className="boton boton--primario boton--pequeno" onClick={guardar} disabled={guardando}>
              {guardando ? t("comun.guardando") : t("admin.espacios.guardar")}
            </button>
            <button className="boton boton--fantasma boton--pequeno" onClick={() => setAbierto(false)}>
              {t("comun.cerrar")}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

function FormularioNuevoEspacio({ onCreado }: { onCreado: () => void }) {
  const { t } = useIdioma();
  const [tipo, setTipo] = useState<TipoEspacio>("sala");
  const [nombre, setNombre] = useState("");
  const [planta, setPlanta] = useState(1);
  const [capacidad, setCapacidad] = useState(4);
  const [equipamiento, setEquipamiento] = useState<Equipamiento[]>([]);
  const [creando, setCreando] = useState(false);

  function alternar(valor: Equipamiento) {
    setEquipamiento((actual) => (actual.includes(valor) ? actual.filter((e) => e !== valor) : [...actual, valor]));
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setCreando(true);
    try {
      await adminApi.crearEspacio({
        tipo,
        nombre,
        planta,
        capacidad,
        equipamiento: tipo === "sala" ? equipamiento : [],
        posX: 40,
        posY: 40,
        ancho: tipo === "sala" ? 200 : 70,
        alto: tipo === "sala" ? 140 : 52,
      });
      setNombre("");
      onCreado();
    } finally {
      setCreando(false);
    }
  }

  return (
    <form className="tarjeta pila" onSubmit={crear}>
      <span className="campo__etiqueta">{t("admin.espacios.nuevo")}</span>
      <div className="fila-campos">
        <label className="campo">
          <span className="campo__etiqueta">{t("admin.espacios.tipo")}</span>
          <select className="campo__control" value={tipo} onChange={(e) => setTipo(e.target.value as TipoEspacio)}>
            <option value="sala">{t("busqueda.tipoSala")}</option>
            <option value="puesto">{t("busqueda.tipoPuesto")}</option>
          </select>
        </label>
        <label className="campo">
          <span className="campo__etiqueta">{t("admin.espacios.nombre")}</span>
          <input className="campo__control" required value={nombre} onChange={(e) => setNombre(e.target.value)} />
        </label>
        <label className="campo">
          <span className="campo__etiqueta">{t("admin.espacios.planta")}</span>
          <select className="campo__control" value={planta} onChange={(e) => setPlanta(Number(e.target.value))}>
            <option value={1}>{t("planta.1")}</option>
            <option value={2}>{t("planta.2")}</option>
          </select>
        </label>
        <label className="campo">
          <span className="campo__etiqueta">{t("admin.espacios.capacidad")}</span>
          <input className="campo__control" type="number" min={1} value={capacidad} onChange={(e) => setCapacidad(Number(e.target.value))} />
        </label>
      </div>
      {tipo === "sala" && (
        <div className="fila">
          {TODO_EQUIPAMIENTO.map((eq) => (
            <button key={eq} type="button" className="casilla" data-marcada={equipamiento.includes(eq)} onClick={() => alternar(eq)}>
              {t(`equipamiento.${eq}`)}
            </button>
          ))}
        </div>
      )}
      <button className="boton boton--primario" type="submit" disabled={creando} style={{ alignSelf: "flex-start" }}>
        {t("admin.espacios.crear")}
      </button>
    </form>
  );
}

export function AdminEspacios() {
  const { t } = useIdioma();
  const [espacios, setEspacios] = useState<Espacio[]>([]);

  async function cargar() {
    setEspacios(await adminApi.espacios());
  }

  useEffect(() => {
    cargar();
  }, []);

  return (
    <div className="contenido">
      <div className="contenedor pila entrada">
        <h1 className="titulo-pagina">{t("admin.espacios.titulo")}</h1>

        <div className="tabla-envoltorio">
          <table className="tabla">
            <thead>
              <tr>
                <th>{t("admin.espacios.nombre")}</th>
                <th>{t("admin.espacios.planta")}</th>
                <th>{t("admin.espacios.capacidad")}</th>
                <th>{t("reserva.equipamiento")}</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {espacios.map((e) => (
                <EditorEspacio key={e.id} espacio={e} onGuardado={cargar} />
              ))}
            </tbody>
          </table>
        </div>

        <FormularioNuevoEspacio onCreado={cargar} />
      </div>
    </div>
  );
}
