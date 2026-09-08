FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

WORKDIR /app

# Copy monorepo configuration and package definitions
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY packages/database/package.json ./packages/database/
COPY packages/types/package.json ./packages/types/
COPY packages/config/package.json ./packages/config/
COPY apps/api/package.json ./apps/api/

# Copy prisma schema and packages
COPY packages/database ./packages/database
COPY packages/types ./packages/types
COPY packages/config ./packages/config

# Install all workspace dependencies
RUN pnpm install --frozen-lockfile

# Copy API source
COPY apps/api ./apps/api

# Generate Prisma client
RUN pnpm db:generate

# Build API
RUN pnpm --filter api build

ENV NODE_ENV=production
ENV PORT=3001
EXPOSE 3001

CMD ["pnpm", "--filter", "api", "start"]
