# Stockeado Pro — Backend

API multi-comercio para Stockeado Pro. Node.js + Express + PostgreSQL (Prisma).

## Puesta en marcha (desarrollo local)

Necesitás Node.js 18+ instalado y una base PostgreSQL (local o en la nube).

```bash
npm install
cp .env.example .env
# editá .env con tu DATABASE_URL real y un JWT_SECRET propio

npm run migrate      # crea todas las tablas
npm run seed         # carga un comercio de prueba con datos de ejemplo
npm run dev           # levanta el servidor en http://localhost:4000
```

Login de prueba después del seed: `admin@demo.com` / `admin1234`

## Deploy a producción

**Guía sin usar la terminal, paso a paso, en [`DEPLOY.md`](./DEPLOY.md).**
Pensada para alguien sin conocimientos de programación — solo clicks en
GitHub y Railway.

Si sabés programar y preferís el flujo técnico con migraciones versionadas
en vez de `db push`, el Dockerfile lo tenés en la raíz del proyecto y el
comando a cambiar está comentado ahí mismo.

## Estructura

```
src/
  config/       ← acá se configura TODO sin tocar lógica (ver CONTRIBUTING.md)
  middleware/   ← auth (JWT) y permisos por rol
  modules/      ← un módulo por carpeta (routes.js + controller.js)
  utils/        ← Prisma client, cálculo de IVA
prisma/
  schema.prisma ← esquema de base de datos completo
```

**¿Necesitás agregar un campo, un rol, un módulo o prender/apagar una función?**
Toda la guía está en [`CONTRIBUTING.md`](./CONTRIBUTING.md) — no hace falta tocar
lógica de negocio para el 90% de los casos.

## Endpoints principales

| Método | Ruta | Qué hace |
|---|---|---|
| POST | `/api/auth/registrar-comercio` | Alta de un comercio nuevo (uso tuyo, al vender a un cliente) |
| POST | `/api/auth/login` | Login, devuelve JWT |
| GET/POST/PUT/DELETE | `/api/productos` | CRUD de inventario |
| POST | `/api/stock/movimiento` | Entrada/salida/ajuste manual de stock |
| GET/POST/PUT/DELETE | `/api/clientes` | CRUD de clientes |
| POST | `/api/ventas` | Registrar una venta (descuenta stock, calcula IVA, todo atómico) |
| GET | `/api/ventas` | Historial de ventas |
| POST | `/api/caja/abrir` / `/cerrar` | Sesión de caja |
| POST | `/api/caja/movimiento` | Ingreso/egreso manual de caja |

Todos (salvo auth) requieren header `Authorization: Bearer <token>`.

## Seguridad — qué ya está resuelto

- Contraseñas con `bcrypt` (hash + salt real, no reversible) — nada que ver con el
  `btoa()` de la versión original en HTML.
- Autenticación por JWT con expiración de 12hs.
- Aislamiento estricto entre comercios: toda query filtra por `comercioId` del token,
  nunca del body de la petición.
- Rate limiting general contra fuerza bruta.
- Validación de entrada con Zod en cada endpoint (nada llega "crudo" a la base de datos).
- Totales de venta calculados siempre en el servidor, nunca confiando en el cliente.

## Qué falta (próximas fases)

- **Fase 2:** Frontend React (Vite) migrado del HTML original para consumir esta API.
- **Fase 3:** Empaquetado en Tauri → instalador `.exe`.
- **Fase 4:** Multi-cuenta para vender a varios comercios desde el mismo panel tuyo,
  backups automáticos.
- **Fase 5:** Facturación electrónica real con CAE de ARCA (el campo `estadoFiscal` y
  `tipoComprobante` en el modelo `Venta` ya están preparados para este cambio sin
  romper lo existente — ver comentarios en `schema.prisma`).
