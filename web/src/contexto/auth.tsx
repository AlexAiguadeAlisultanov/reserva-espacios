import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { authApi } from "../api/servicios.js";
import { ErrorApi } from "../api/cliente.js";
import type { Usuario } from "../tipos.js";

interface ContextoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  entrar: (email: string, contrasena: string) => Promise<void>;
  salir: () => Promise<void>;
}

const ContextoAuthReact = createContext<ContextoAuth | null>(null);

export function ProveedorAuth({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    authApi
      .yo()
      .then(setUsuario)
      .catch(() => setUsuario(null))
      .finally(() => setCargando(false));
  }, []);

  const entrar = useCallback(async (email: string, contrasena: string) => {
    const datos = await authApi.entrar(email, contrasena);
    setUsuario(datos);
  }, []);

  const salir = useCallback(async () => {
    await authApi.salir();
    setUsuario(null);
  }, []);

  const valor = useMemo(() => ({ usuario, cargando, entrar, salir }), [usuario, cargando, entrar, salir]);

  return <ContextoAuthReact.Provider value={valor}>{children}</ContextoAuthReact.Provider>;
}

export function useAuth(): ContextoAuth {
  const contexto = useContext(ContextoAuthReact);
  if (!contexto) throw new Error("useAuth debe usarse dentro de ProveedorAuth");
  return contexto;
}

export { ErrorApi };
