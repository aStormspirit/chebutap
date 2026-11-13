# syntax=docker/dockerfile:1
FROM node:22-bookworm-slim

RUN apt-get update \
 && apt-get install -y --no-install-recommends git ca-certificates curl \
 && rm -rf /var/lib/apt/lists/* \
 && npm install -g @anthropic-ai/claude-code \
 && npm cache clean --force

WORKDIR /app
COPY package.json ./
COPY src ./src

# Claude Code не запускается с --dangerously-skip-permissions от root.
USER node
ENV WORK_DIR=/home/node/work NODE_ENV=production
CMD ["node", "src/index.mjs"]
