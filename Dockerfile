# Construccion en dos etapas: se compila con las dependencias completas y se
# ejecuta con solo las de produccion, para que la imagen final sea pequena.

FROM node:24-slim AS build
WORKDIR /app

COPY package.json ./
COPY server/package.json server/package.json
COPY web/package.json web/package.json
RUN npm install

COPY . .
RUN npm run build

FROM node:24-slim
WORKDIR /app/server
ENV NODE_ENV=production

COPY --from=build /app/server/package.json ./package.json
RUN npm install --omit=dev

COPY --from=build /app/server/dist ./dist
COPY --from=build /app/server/public ./public

ENV PORT=8003
EXPOSE 8003
CMD ["node", "dist/server.js"]
