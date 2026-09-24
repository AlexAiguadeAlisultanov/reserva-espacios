// Contrasenas con scrypt (nativo de node:crypto, sin dependencias externas).
// Formato guardado: "sal_hex:hash_hex".

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb);
const LONGITUD_CLAVE = 64;

export async function hashearContrasena(contrasena: string): Promise<string> {
  const sal = randomBytes(16);
  const derivada = (await scrypt(contrasena, sal, LONGITUD_CLAVE)) as Buffer;
  return `${sal.toString("hex")}:${derivada.toString("hex")}`;
}

export async function verificarContrasena(contrasena: string, hashGuardado: string): Promise<boolean> {
  const [salHex, hashHex] = hashGuardado.split(":");
  if (!salHex || !hashHex) return false;
  const sal = Buffer.from(salHex, "hex");
  const esperado = Buffer.from(hashHex, "hex");
  const derivada = (await scrypt(contrasena, sal, LONGITUD_CLAVE)) as Buffer;
  if (derivada.length !== esperado.length) return false;
  return timingSafeEqual(derivada, esperado);
}
