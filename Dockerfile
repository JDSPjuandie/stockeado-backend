# node:20-slim (Debian) en vez de Alpine — Prisma necesita OpenSSL y
# Alpine (musl) da problemas conocidos de compatibilidad con el motor
# de Prisma. slim + openssl instalado es la combinación estable.
FROM node:20-slim

# Prisma necesita openssl para conectarse a la base de datos.
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

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
