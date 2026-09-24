import { useEffect, type ReactNode } from "react";
import { X } from "lucide-react";
import { useIdioma } from "../i18n/contexto.js";

export function Modal({ titulo, onCerrar, children }: { titulo: string; onCerrar: () => void; children: ReactNode }) {
  const { t } = useIdioma();

  useEffect(() => {
    const alTeclear = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    window.addEventListener("keydown", alTeclear);
    return () => window.removeEventListener("keydown", alTeclear);
  }, [onCerrar]);

  return (
    <div className="velo-modal" onClick={onCerrar}>
      <div className="panel-modal entrada" role="dialog" aria-modal="true" aria-label={titulo} onClick={(e) => e.stopPropagation()}>
        <div className="panel-modal__cabecera">
          <h2 style={{ fontSize: "1.1rem", fontWeight: 600 }}>{titulo}</h2>
          <button className="boton boton--fantasma" onClick={onCerrar} aria-label={t("comun.cerrar")}>
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
