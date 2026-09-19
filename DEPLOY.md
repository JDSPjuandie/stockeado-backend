# Poner Stockeado en línea — guía sin usar la terminal

Esto lo hacés una sola vez. Son 2 sitios web (GitHub y Railway), cuentas
gratis, todo con el mouse.

## Paso 1 — Subir el código a GitHub

1. Andá a [github.com](https://github.com) y creá una cuenta (gratis).
2. Arriba a la derecha, botón verde **"New"** → creá un repositorio.
   Nombre: `stockeado-backend`. Dejalo en "Public" o "Private", da igual.
   NO marques ninguna casilla de "Add README" — dejalo vacío. Creá.
3. En la página que aparece, buscá el link que dice **"uploading an
   existing file"**.
4. Abrí la carpeta `stockeado-backend` que descargaste de este chat en
   tu explorador de archivos, seleccioná TODO lo que hay adentro
   (Ctrl+A) y arrastralo a la página de GitHub.
5. Abajo, botón verde **"Commit changes"**.

Listo, tu código ya está en internet (privado, solo vos lo ves).

## Paso 2 — Crear la base de datos y el servidor en Railway

1. Andá a [railway.app](https://railway.app) → **Login** → entrá con tu
   cuenta de GitHub (un solo click, sin crear otra contraseña).
2. **New Project** → **Deploy from GitHub repo** → elegí `stockeado-backend`.
3. Va a empezar a "buildear" solo. Mientras tanto: dentro del mismo
   proyecto, botón **"+ New"** → **Database** → **PostgreSQL**.
4. Hacé click en el recuadro de tu servicio backend (no en la base de
   datos) → pestaña **Variables** → **"+ New Variable"** y agregá,
   una por una:

   | Variable | Valor |
   |---|---|
   | `DATABASE_URL` | Hacé click en el campo de valor, elegí "Add Reference" y seleccioná la base Postgres que creaste — se completa sola |
   | `JWT_SECRET` | `99d48d288bb58b0fcee872a270345ab23b56fbaeaec947e42df7fdcb9404220e36e2eb1ff448148912d5a07de239368b` |
   | `NODE_ENV` | `production` |

5. Esperá a que termine (círculo verde). Andá a la pestaña
   **Settings** de tu servicio → sección **Networking** → botón
   **"Generate Domain"**. Te da una dirección tipo
   `stockeado-backend-production.up.railway.app`.

6. **Copiá esa dirección y pegámela acá en el chat.** Con eso te armo
   la parte 2 (la pantalla que vas a usar en el local).

## Verificación rápida

Pegá tu dirección + `/health` en el navegador (ej:
`https://stockeado-backend-production.up.railway.app/health`). Tiene
que aparecer algo como `{"ok":true,"servicio":"stockeado-backend"}`.
Si aparece eso, andá al paso 6. Si da error, avisame qué dice.
