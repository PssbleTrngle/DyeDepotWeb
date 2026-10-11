FROM oven/bun:1 AS base
WORKDIR /app

FROM base AS builder
COPY . .

ARG repository
ENV GIT_REPOSITORY=$repository
ARG commit
ENV GIT_COMMIT=$commit
ARG branch
ENV GIT_BRANCH=$branch
arg discordInviteUrl
ENV DISCORD_INVITE_URL=$discordInviteUrl

RUN bun install --frozen-lockfile --production
RUN bun run build

FROM base AS runner

COPY --from=builder --chown=bun:bun /app/dist ./dist

ENV HOST=0.0.0.0
ENV PORT=80
EXPOSE 80

CMD ["node", "./dist/server/entry.mjs"]