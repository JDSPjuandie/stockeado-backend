# Cómo agregar cosas a Stockeado sin tocar el resto del sistema

Esta guía cubre los 4 tipos de cambio que vas a necesitar el 95% de las veces.
Están ordenados del más simple al más complejo.

---

## 1. Agregar un campo nuevo a un formulario (ej: "Talle" en Producto)

**Archivo:** `src/config/fields.config.js`

```js
producto: [
  { key: 'talle', label: 'Talle', tipo: 'select', opciones: ['S','M','L','XL'], requerido: false },
],
```

Eso alcanza. El campo se guarda en `camposExtra` (columna JSON) sin migración de base de datos.
Al mandar el producto desde el frontend, incluilo dentro de `camposExtra: { talle: 'M' }`.

**No hace falta:** tocar `schema.prisma`, correr migraciones, ni tocar el controller de productos.

---

## 2. Agregar un rol nuevo (ej: "Encargado de turno noche")

**Archivo:** `src/config/roles.config.js`

```js
turnoNoche: {
  label: 'Encargado de turno noche',
  permisos: ['pos:*', 'caja:*', 'inventario:leer'],
},
```

Los permisos son `"modulo:accion"`. `"*"` significa "todos". Se validan solos en cada ruta
gracias al middleware `requirePermiso`, no hay que tocar ningún controller.

---

## 3. Agregar un módulo nuevo completo (ej: "Proveedores")

Un módulo = una carpeta en `src/modules/` con 2 archivos: `routes.js` y `controller.js`.

**Paso a paso:**

1. Copiá `src/modules/_template/` y renombrala (ej: `src/modules/proveedores/`).
2. Abrí `controller.js` y reemplazá `<Entidad>` y `<entidad>` por el nombre real
   (ej: `Proveedor` / `proveedor`). Ajustá el schema de Zod con los campos que necesitás.
3. Abrí `routes.js` y reemplazá `<modulo>` por el nombre real (ej: `proveedores`).
4. Si la entidad es nueva (no existe en la base de datos todavía), agregala en
   `prisma/schema.prisma` siguiendo el patrón de los modelos existentes — importante:
   **siempre** con `comercioId` y su relación a `Comercio`, si no, se rompe el aislamiento
   entre comercios. Después corré:
   ```
   npm run migrate
   ```
   Te va a pedir un nombre para la migración (ej: "agrega_proveedores") y listo, la tabla
   se crea sola.
5. Registrá el módulo en `src/config/modules.config.js`:
   ```js
   { nombre: 'proveedores', basePath: '/api/proveedores', router: require('../modules/proveedores/routes') },
   ```
6. Agregá los permisos del módulo nuevo (`proveedores:leer`, etc.) a los roles que
   correspondan en `roles.config.js`.

**No hace falta:** tocar `server.js` — lee `modules.config.js` solo y monta la ruta.

---

## 4. Prender/apagar una funcionalidad por plan (ej: multi-sucursal solo en plan Pro)

**Archivo:** `src/config/features.config.js`

```js
pro: {
  multiSucursal: true,
  // ...
}
```

En la ruta que corresponda, protegé el endpoint:

```js
router.post('/sucursales', requireAuth, requireFeature('multiSucursal'), ctrl.crear);
```

Si el comercio no tiene esa feature en su plan, la API devuelve 402 automáticamente.

---

## Reglas de oro (para no romper el aislamiento multi-comercio)

- **Toda query a la base de datos tiene que filtrar por `comercioId`.** Sin excepción.
  El patrón es siempre `where: { id: req.params.id, comercioId: req.user.comercioId }` —
  así, aunque alguien adivine el ID de un registro de otro comercio, no lo puede tocar.
- **Nunca confíes en totales/precios que vengan del frontend.** Recalculalos en el
  controller (mirá `ventas/controller.js` como ejemplo: el total se calcula server-side
  con `calcularIVA()`, ignorando cualquier total que mande el cliente).
- **Preferí baja lógica (`activo: false`) antes que `delete`** en cualquier entidad que
  pueda estar referenciada en una venta o un historial — borrarla de verdad rompe esas
  referencias.
