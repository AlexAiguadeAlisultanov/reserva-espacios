import { Check } from "lucide-react";
import type { ReactNode } from "react";

export function Casilla({ marcada, onClick, children }: { marcada: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="casilla" data-marcada={marcada} onClick={onClick}>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: 4,
          border: "1px solid var(--borde-fuerte)",
          background: marcada ? "var(--acento)" : "transparent",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        {marcada && <Check size={12} color="#1a0e09" strokeWidth={3} />}
      </span>
      {children}
    </button>
  );
}
