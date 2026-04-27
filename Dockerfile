FROM node:24-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./
RUN npm ci

FROM deps AS builder

COPY . .
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]
