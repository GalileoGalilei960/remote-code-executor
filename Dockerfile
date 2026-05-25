FROM node:22-alpine AS builder

WORKDIR /app

ENV CI=TRUE
ENV NODE_ENV=production

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml .pnpmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts && \
    pnpm store prune

COPY . .

RUN pnpm dlx prisma generate && \
    pnpm run build

FROM node:22-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

RUN corepack enable pnpm && \
    apk add --no-cache tini

COPY --from=builder /app/package.json /app/pnpm-lock.yaml /app/.pnpmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts --prod && \
    pnpm store prune

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/src/main.js"]