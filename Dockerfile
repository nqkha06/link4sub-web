# syntax=docker/dockerfile:1.7

# ==========================================
# 1. Dependencies
# ==========================================

FROM node:22-bookworm-slim AS dependencies

ENV PNPM_HOME=/pnpm \
    PATH=/pnpm:$PATH \
    NEXT_TELEMETRY_DISABLED=1

RUN corepack enable \
    && corepack prepare pnpm@10.13.1 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
COPY patches ./patches

RUN --mount=type=cache,id=stu-web-pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile


# ==========================================
# 2. Build Next.js
# ==========================================

FROM dependencies AS build

# API_URL chỉ dùng để đáp ứng cấu hình tại build time.
# URL thực tế phải được thiết lập tại runtime trên Dokploy.
ARG API_URL="http://127.0.0.1:4000"
ARG WEB_URL="http://localhost:3000"

ARG NEXT_PUBLIC_GOOGLE_CLIENT_ID=""
ARG NEXT_PUBLIC_SENTRY_DSN=""
ARG NEXT_PUBLIC_APP_ENV="production"
ARG NEXT_PUBLIC_APP_RELEASE=""

ENV API_URL=$API_URL \
    WEB_URL=$WEB_URL \
    NEXT_PUBLIC_GOOGLE_CLIENT_ID=$NEXT_PUBLIC_GOOGLE_CLIENT_ID \
    NEXT_PUBLIC_SENTRY_DSN=$NEXT_PUBLIC_SENTRY_DSN \
    NEXT_PUBLIC_APP_ENV=$NEXT_PUBLIC_APP_ENV \
    NEXT_PUBLIC_APP_RELEASE=$NEXT_PUBLIC_APP_RELEASE

COPY . .

RUN pnpm build


# ==========================================
# 3. Production Runtime
# ==========================================

FROM node:22-bookworm-slim AS web

ENV NODE_ENV=production \
    HOSTNAME=0.0.0.0 \
    PORT=3000 \
    NEXT_TELEMETRY_DISABLED=1

RUN groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

WORKDIR /app

COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]