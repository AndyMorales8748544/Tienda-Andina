FROM node:24-bookworm-slim

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev

COPY src ./src
COPY public ./public

RUN mkdir -p /app/data && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/tienda.db

EXPOSE 3000

CMD ["sh", "-c", "node src/seed.js && exec node src/server.js"]
