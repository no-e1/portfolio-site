FROM node:24-bookworm-slim AS runtime-base

RUN apt-get update \
    && apt-get install --yes --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM runtime-base AS base

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

RUN npm install --global pnpm@10.15.1

WORKDIR /app

FROM base AS dependencies

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

FROM dependencies AS build

COPY nest-cli.json prisma.config.ts tsconfig.build.json tsconfig.json ./
COPY prisma ./prisma
COPY src ./src

RUN DATABASE_URL=mysql://build:build@localhost:3306/build pnpm exec prisma generate \
    && pnpm build \
    && pnpm prune --prod

FROM runtime-base AS runtime

ENV NODE_ENV=production

WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/package.json ./package.json
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --from=build --chown=node:node /app/prisma.config.ts ./prisma.config.ts

RUN mkdir -p \
      /app/uploads/documents \
      /app/uploads/projects \
      /app/private-storage/documents \
      /app/private-storage/hobbies \
    && chown -R node:node /app/uploads /app/private-storage

USER node

EXPOSE 3000

CMD ["node", "dist/main-public.js"]
