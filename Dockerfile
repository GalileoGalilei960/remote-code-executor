FROM node:22-alpine AS builder

WORKDIR /app

RUN corepack enable pnpm
RUN pnpm config set ignore-scripts false

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

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

EXPOSE 3000

CMD ["node", "dist/src/main.js"]