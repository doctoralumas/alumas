# Alumas v32 — immutable release image
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
# Copy Prisma schema before installing so postinstall (prisma generate) can find it
# Avoid running lifecycle scripts (postinstall/prisma generate) during deps install — generation runs in the builder stage
ENV NPM_CONFIG_IGNORE_SCRIPTS=true
COPY prisma ./prisma
RUN npm ci

FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ARG APP_VERSION=dev
ARG BUILD_SHA=local
ENV APP_VERSION=$APP_VERSION
ENV BUILD_SHA=$BUILD_SHA
RUN npx prisma generate && npm run build

FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ARG APP_VERSION=dev
ARG BUILD_SHA=local
LABEL org.opencontainers.image.title="Alumas" \
      org.opencontainers.image.version=$APP_VERSION \
      org.opencontainers.image.revision=$BUILD_SHA \
      org.opencontainers.image.source="alumas"
ENV APP_VERSION=$APP_VERSION
ENV BUILD_SHA=$BUILD_SHA
COPY --from=builder /app ./
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 CMD wget -qO- http://127.0.0.1:3000/api/healthcheck || exit 1
CMD ["npm","start"]
