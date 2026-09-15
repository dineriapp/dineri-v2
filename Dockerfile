ARG NODE_VERSION=22.20.0
ARG PNPM_VERSION=11.15.0

FROM node:${NODE_VERSION}-slim AS deps

ARG PNPM_VERSION

WORKDIR /app

RUN corepack enable && corepack prepare pnpm@${PNPM_VERSION} --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./

RUN HUSKY=0 pnpm install --frozen-lockfile


FROM deps AS builder

WORKDIR /app

ARG NEXT_PUBLIC_BETTER_AUTH_URL
ARG NEXT_PUBLIC_SESSION_COOKIE_NAME=dineri
ARG NEXT_PUBLIC_LOG_LEVEL=info
ARG AWS_BUCKET_NAME
ARG AWS_BUCKET_REGION

ENV NEXT_PUBLIC_BETTER_AUTH_URL=${NEXT_PUBLIC_BETTER_AUTH_URL} \
    NEXT_PUBLIC_SESSION_COOKIE_NAME=${NEXT_PUBLIC_SESSION_COOKIE_NAME} \
    NEXT_PUBLIC_LOG_LEVEL=${NEXT_PUBLIC_LOG_LEVEL} \
    AWS_BUCKET_NAME=${AWS_BUCKET_NAME} \
    AWS_BUCKET_REGION=${AWS_BUCKET_REGION} \
    NEXT_TELEMETRY_DISABLED=1

COPY . .

RUN test -n "${NEXT_PUBLIC_BETTER_AUTH_URL}" || { \
      echo "ERROR: NEXT_PUBLIC_BETTER_AUTH_URL is missing"; \
      exit 1; \
    }

# Build-only placeholder values.
# These must NOT be used for real external connections during build.
ENV DATABASE_URL="postgresql://build:build@build.invalid:5432/build" \
    REDIS_URL="redis://build.invalid:6379" \
    ENCRYPTION_KEY="build-placeholder-not-a-real-key" \
    STRIPE_SECRET_KEY="sk_test_build_placeholder" \
    BETTER_AUTH_SECRET="build-placeholder-not-a-real-secret"

RUN pnpm run build

EXPOSE 3000

CMD ["sh", "-c", "pnpm db:push && pnpm start"]