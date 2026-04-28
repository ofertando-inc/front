FROM node:24-alpine AS base

WORKDIR /app

FROM base AS deps

COPY package*.json ./
RUN npm ci --ignore-scripts

FROM deps AS builder

ARG PUBLIC_API_URL
ENV PUBLIC_API_URL=$PUBLIC_API_URL

COPY . .
RUN npm run build

FROM base AS runner

ENV NODE_ENV=production

COPY package*.json ./
RUN npm ci --omit=dev --ignore-scripts

COPY --from=builder /app/build ./build

EXPOSE 3000

CMD ["node", "build"]
