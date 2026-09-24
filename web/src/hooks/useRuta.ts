import { useCallback, useEffect, useState } from "react";

function leerRuta(): string {
  const hash = window.location.hash.replace(/^#/, "");
  return hash || "/plano";
}

/** Enrutado minimo basado en location.hash, sin librerias: suficiente para
 * unas pocas pantallas y mantiene el enlace util al recargar o compartir. */
export function useRuta(): [string, (ruta: string) => void] {
  const [ruta, setRutaEstado] = useState(leerRuta);

  useEffect(() => {
    const alCambiar = () => setRutaEstado(leerRuta());
    window.addEventListener("hashchange", alCambiar);
    return () => window.removeEventListener("hashchange", alCambiar);
  }, []);

  const navegar = useCallback((nuevaRuta: string) => {
    window.location.hash = nuevaRuta;
    setRutaEstado(nuevaRuta);
  }, []);

  return [ruta, navegar];
}
