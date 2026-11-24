FROM node:24-bookworm-slim AS build

WORKDIR /app

COPY package*.json ./

RUN npm ci --omit=dev


FROM node:24-bookworm-slim

WORKDIR /app

RUN rm -rf /usr/local/lib/node_modules \
    /opt/yarn* \
    /usr/local/bin/npm \
    /usr/local/bin/npx \
    /usr/local/bin/corepack \
    /usr/local/bin/yarn \
    /usr/local/bin/yarnpkg

COPY --from=build /app/node_modules ./node_modules

COPY src ./src
COPY public ./public

RUN mkdir -p /app/data && chown -R node:node /app

USER node

ENV NODE_ENV=production
ENV PORT=3000
ENV DB_PATH=/app/data/tienda.db

EXPOSE 3000

CMD ["sh", "-c", "node src/seed.js && exec node src/server.js"]
