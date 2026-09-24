import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { DICCIONARIO, IDIOMA_POR_DEFECTO, type Idioma } from "./diccionario.js";

const CLAVE_LOCALSTORAGE = "reserva-espacios:idioma";

function leerIdiomaGuardado(): Idioma {
  try {
    const valor = localStorage.getItem(CLAVE_LOCALSTORAGE);
    if (valor === "es" || valor === "ca" || valor === "en") return valor;
  } catch {
    // localStorage puede fallar en navegacion privada; nos quedamos con el idioma por defecto.
  }
  return IDIOMA_POR_DEFECTO;
}

interface ContextoIdioma {
  idioma: Idioma;
  cambiarIdioma: (idioma: Idioma) => void;
  t: (clave: string, variables?: Record<string, string | number>) => string;
}

const ContextoIdiomaReact = createContext<ContextoIdioma | null>(null);

export function ProveedorIdioma({ children }: { children: ReactNode }) {
  const [idioma, setIdioma] = useState<Idioma>(leerIdiomaGuardado);

  const cambiarIdioma = useCallback((nuevo: Idioma) => {
    setIdioma(nuevo);
    try {
      localStorage.setItem(CLAVE_LOCALSTORAGE, nuevo);
    } catch {
      // sin persistencia si el navegador la bloquea; no es critico
    }
  }, []);

  const t = useCallback(
    (clave: string, variables?: Record<string, string | number>) => {
      const textos = DICCIONARIO[idioma];
      let texto = textos[clave] ?? clave;
      if (variables) {
        for (const [k, v] of Object.entries(variables)) {
          texto = texto.replace(`{{${k}}}`, String(v));
        }
      }
      return texto;
    },
    [idioma]
  );

  const valor = useMemo(() => ({ idioma, cambiarIdioma, t }), [idioma, cambiarIdioma, t]);

  return <ContextoIdiomaReact.Provider value={valor}>{children}</ContextoIdiomaReact.Provider>;
}

export function useIdioma(): ContextoIdioma {
  const contexto = useContext(ContextoIdiomaReact);
  if (!contexto) throw new Error("useIdioma debe usarse dentro de ProveedorIdioma");
  return contexto;
}
