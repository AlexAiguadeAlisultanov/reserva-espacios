// Sesion propia con cookie firmada, sin libreria de sesiones: un payload en
// base64url mas una firma HMAC-SHA256, httpOnly y sameSite=lax. No guarda
// estado en el servidor, asi que sobrevive a un reinicio del proceso.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response } from "express";

const NOMBRE_COOKIE = "sesion";
const DURACION_MS = 1000 * 60 * 60 * 24 * 7; // 7 dias

export interface CargaSesion {
  uid: string;
  rol: "empleado" | "admin";
  exp: number;
}

function secreto(): string {
  const valor = process.env.SESSION_SECRET;
  if (!valor) {
    // En desarrollo local sin .env esto evita que el arranque falle; en
    // produccion (Render) SESSION_SECRET siempre viene definido por render.yaml.
    return "secreto-de-desarrollo-no-usar-en-produccion";
  }
  return valor;
}

function firmar(base64: string): string {
  return createHmac("sha256", secreto()).update(base64).digest("base64url");
}

function codificar(carga: CargaSesion): string {
  const base64 = Buffer.from(JSON.stringify(carga)).toString("base64url");
  return `${base64}.${firmar(base64)}`;
}

function decodificar(token: string): CargaSesion | null {
  const [base64, firma] = token.split(".");
  if (!base64 || !firma) return null;
  const firmaEsperada = firmar(base64);
  const a = Buffer.from(firma);
  const b = Buffer.from(firmaEsperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const carga = JSON.parse(Buffer.from(base64, "base64url").toString("utf8")) as CargaSesion;
    if (typeof carga.exp !== "number" || carga.exp < Date.now()) return null;
    return carga;
  } catch {
    return null;
  }
}

function leerCookie(req: Request, nombre: string): string | null {
  const cabecera = req.headers.cookie;
  if (!cabecera) return null;
  for (const parte of cabecera.split(";")) {
    const [clave, ...resto] = parte.trim().split("=");
    if (clave === nombre) return decodeURIComponent(resto.join("="));
  }
  return null;
}

export function crearSesion(res: Response, uid: string, rol: "empleado" | "admin"): void {
  const carga: CargaSesion = { uid, rol, exp: Date.now() + DURACION_MS };
  const token = codificar(carga);
  res.cookie(NOMBRE_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: DURACION_MS,
    path: "/",
  });
}

export function borrarSesion(res: Response): void {
  res.clearCookie(NOMBRE_COOKIE, { path: "/" });
}

export function leerSesion(req: Request): CargaSesion | null {
  const token = leerCookie(req, NOMBRE_COOKIE);
  if (!token) return null;
  return decodificar(token);
}
