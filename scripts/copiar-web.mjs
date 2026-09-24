// Copia el resultado del build de `web/` a `server/public/` para que el servidor
// lo sirva como estatico. Se ejecuta como parte de `npm run build` en la raiz.
import { cpSync, rmSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const raiz = path.dirname(fileURLToPath(import.meta.url)) + "/..";
const origen = path.join(raiz, "web", "dist");
const destino = path.join(raiz, "server", "public");

if (!existsSync(origen)) {
  console.error("No existe web/dist. Ejecuta antes 'npm run build -w web'.");
  process.exit(1);
}

rmSync(destino, { recursive: true, force: true });
cpSync(origen, destino, { recursive: true });
console.log(`Copiado ${origen} -> ${destino}`);
