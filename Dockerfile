# Imagen liviana de Node — suficiente para una API Express + Prisma.
FROM node:20-alpine

WORKDIR /app

# Instala dependencias primero (aprovecha el cache de Docker: si no
# cambiaste package.json, no reinstala en cada build).
COPY package*.json ./
RUN npm ci --omit=dev

# Copia el resto del código, genera el cliente de Prisma.
COPY . .
RUN npx prisma generate

EXPOSE 4000

# db push sincroniza las tablas directo desde schema.prisma al arrancar
# — sin pasos manuales previos. (Alternativa más "correcta" para quien
# programa: generar migraciones con `prisma migrate dev` localmente y
# cambiar esto a `prisma migrate deploy` — ver README.)
CMD npx prisma db push --accept-data-loss --skip-generate && node src/server.js
