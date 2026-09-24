import { abrirBaseDeDatos, baseDeDatosVacia, crearEsquema } from "./db.js";
import { sembrar } from "./sembrar.js";
import { crearApp } from "./app.js";

async function main() {
  const ruta = process.env.RUTA_BASE_DE_DATOS ?? "data/reserva.db";
  const db = abrirBaseDeDatos(ruta);
  crearEsquema(db);

  if (baseDeDatosVacia(db)) {
    console.log("Base de datos vacia: sembrando la oficina de ejemplo...");
    await sembrar(db);
    console.log("Listo: usuarios, espacios y reservas de ejemplo creados.");
  }

  const app = crearApp(db);
  const puerto = Number(process.env.PORT) || 8003;
  app.listen(puerto, () => {
    console.log(`Reserva de espacios escuchando en el puerto ${puerto}`);
  });
}

main().catch((error) => {
  console.error("No se pudo arrancar el servidor:", error);
  process.exit(1);
});
