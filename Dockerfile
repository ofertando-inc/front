FROM node:24-alpine AS base

WORKDIR /app

COPY package*.json ./

FROM base AS build

ENV NODE_ENV=development

RUN npm ci

COPY . .

RUN npm run build

FROM node:24-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY package*.json ./

RUN npm ci --omit=dev \
 && npm cache clean --force

COPY --from=build /app/build ./build
COPY docker/entrypoint.sh ./docker/entrypoint.sh

RUN chmod +x ./docker/entrypoint.sh \
 && chown -R node:node /app

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:3000/ || exit 1

ENTRYPOINT ["./docker/entrypoint.sh"]
