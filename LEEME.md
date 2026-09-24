# Reserva de espacios

Una oficina híbrida no necesita una hoja de cálculo compartida ni un canal de
Slack donde la gente pregunta "¿está libre la sala grande a las once?". Esto
es un planificador de salas de reuniones y puestos de trabajo flexibles:
cada persona ve en un plano qué está libre ahora mismo, reserva con un clic
y, si al final no aparece, el sistema libera el hueco solo para que otro lo
use.

## Cuentas de demo

La contraseña es `prova1234` para las tres. La pantalla de acceso tiene un
botón por cada una para no tener que teclearlas.

| Correo | Rol |
|---|---|
| `nuria@empresa.test` | Empleada |
| `pau@empresa.test` | Empleado |
| `oficina@empresa.test` | Administración |

## Qué se puede hacer

- **Plano interactivo**: dos plantas, cinco salas y treinta puestos dibujados
  en SVG. Se elige fecha y franja, el plano se colorea en libre, ocupado o
  bloqueado, y se reserva pulsando directamente sobre el espacio.
- **Agenda por sala**: el mismo día partido en franjas de media hora, para
  ver de un vistazo cuándo hay huecos en una sala concreta.
- **Búsqueda**: "una sala para seis personas el jueves de diez a once, con
  videoconferencia" se traduce en un formulario con fecha, franja, capacidad
  mínima y equipamiento.
- **Reservas recurrentes**: repetir una reserva cada semana hasta una fecha
  límite. Se crea todo o nada: si una sola semana choca con algo, no se crea
  ninguna.
- **Check-in**: quien reserva una sala tiene quince minutos desde el inicio
  para confirmar que ha llegado. Si no lo hace, el espacio se libera solo la
  próxima vez que alguien consulta disponibilidad o intenta reservar: no hay
  ninguna tarea programada de fondo, es un cálculo contra la hora actual.
- **Mis reservas**: próximas y pasadas, con el estado de cada una
  (confirmada, cancelada, no presentada) y los botones de check-in y
  cancelar.
- **Administración**: alta y baja de espacios, bloqueo temporal con motivo
  (una obra, una avería), las reglas de la oficina (antelación máxima,
  duración máxima y mínima, horario) y un panel de ocupación con el
  porcentaje de uso por espacio y por día de la semana, más el recuento de
  reservas no presentadas.

## Cómo arrancarlo

```bash
npm install
npm run dev
```

Eso levanta la API en el puerto 8003 y Vite en el 5183 a la vez, con proxy
del segundo al primero. Para probar en un único proceso, como se despliega
de verdad:

```bash
npm run build
npm start
```

Al arrancar con la base de datos vacía se siembra sola con la oficina de
ejemplo (usuarios, espacios y una semana de reservas). En Render el disco es
efímero, así que cada reinicio de la demo vuelve a sembrar desde cero: es lo
esperado, no un fallo.

Comprobaciones:

```bash
npm run comprobar   # tsc sin emitir, servidor y web
npm test             # vitest sobre las reglas de negocio del servidor
```

## Cómo está hecho

Un repositorio con dos partes. `server/` es una API en Express 5 con
TypeScript, base de datos SQLite a través de `node:sqlite` (el módulo nativo
de Node 24, sin nada que compilar) y sesión propia con cookie firmada. `web/`
es Vite con React 19 y TypeScript, sin librería de componentes: el sistema
visual es CSS con variables propio.

Las reglas de negocio (que dos reservas del mismo espacio nunca se solapen,
que un empleado no tenga dos puestos a la misma hora, el horario de oficina,
la antelación máxima, la liberación por falta de check-in, la generación de
una serie recurrente) viven en `server/src/engine/`, como funciones puras
sin acceso a base de datos. Eso es lo que tienen los tests de
`server/tests/`. La capa que las conecta con SQLite está en
`server/src/servicios/`, y ahí la creación de una reserva se ejecuta entera
dentro de una transacción (`BEGIN IMMEDIATE` / `COMMIT` / `ROLLBACK`): si
cualquier ocurrencia de una serie recurrente choca con algo, no queda ni
rastro de las demás.

Las horas se guardan siempre como instante UTC y se interpretan siempre como
hora de Madrid, tanto al guardar como al mostrar. La conversión está escrita
a mano con `Intl.DateTimeFormat` y una zona horaria explícita
(`server/src/engine/tiempo.ts` y su equivalente en el cliente,
`web/src/utilidades/tiempo.ts`), en lugar de con una librería. La primera
versión usaba `date-fns-tz`, pero una prueba concreta mostró que su
resultado cambiaba según la zona horaria del proceso que ejecutaba el
código, algo inaceptable para una aplicación que reserva salas por hora: se
quitó la dependencia entera. La recurrencia semanal suma semanas conservando
la hora de pared local, no 7×24 horas en UTC, para que una reunión de las
diez no se desplace una hora cuando la serie cruza el cambio de horario de
finales de octubre.

Los tres idiomas son un diccionario propio tipado
(`web/src/i18n/diccionario.ts`), sin librería de internacionalización, con
el idioma recordado en `localStorage` y español por defecto.

## Decisiones y por qué

- **`node:sqlite` en vez de un paquete de npm**: es nativo desde Node 22.5 y
  estable en Node 24, así que no hace falta compilar nada al desplegar. El
  único cuidado real fue que algunas herramientas de build (concretamente
  `vite-node`, que usa Vitest por debajo) reescriben `node:sqlite` quitando
  el prefijo `node:`, y ese módulo solo existe con el prefijo. Se resolvió
  cargándolo con `createRequire` en vez de un `import` estático, que no se
  reescribe.
- **Sesión propia en vez de una librería**: una cookie firmada con HMAC y sin
  estado en el servidor es simple, no añade una dependencia y sobrevive a un
  reinicio del proceso (importante en Render, con el disco efímero).
- **Reservas recurrentes como filas independientes**: en vez de guardar una
  regla de repetición y calcular las ocurrencias cada vez, se generan y
  guardan todas las reservas de la serie de una vez, unidas por un
  `recurrencia_id`. Así comprobar solapes es la misma consulta tanto para
  una reserva suelta como para una recurrente, sin lógica duplicada.
- **El check-in se calcula, no se guarda como una tarea de fondo**: cualquier
  consulta de disponibilidad, de agenda o de reservas propias empieza
  liberando lo que ya debería estar liberado. Es más simple que un cron y no
  necesita ningún proceso adicional corriendo en Render.

## Qué no llegó a comprobarse

Se probó todo el flujo con `curl` contra la API real (login de los tres
roles, crear reserva, listar, cancelar, el caso de permiso denegado, la
reserva recurrente, un espacio bloqueado, la agenda, el panel de admin) y
los 48 tests de las reglas de negocio pasan. Lo que no se llegó a abrir es
un navegador de verdad: ni el plano SVG pulsando con el ratón, ni el aviso
de check-in en pantalla mientras pasan los minutos, ni las tres traducciones
una al lado de otra. El código de la interfaz compila sin errores de tipos
contra los mismos tipos que expone la API, que es la comprobación que se
pudo hacer sin abrir un navegador.
