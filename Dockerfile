FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS builder
COPY . .

RUN bun install --frozen-lockfile --production
RUN bun run build

FROM base AS runner

COPY --from=builder --chown=bun:bun /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80

CMD ["node", "./dist/server/entry.mjs"]