FROM node:22-alpine AS builder

WORKDIR /app

ENV CI=TRUE

RUN corepack enable pnpm

COPY package.json pnpm-lock.yaml .pnpmrc ./
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . . 

RUN pnpm dlx prisma generate
RUN pnpm run build

FROM node:22-alpine AS production

WORKDIR /app

RUN corepack enable pnpm

COPY --from=builder /app/package.json ./
COPY --from=builder /app/pnpm-lock.yaml ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts
COPY .env ./

EXPOSE 3000

CMD ["node", "dist/src/main.js"]