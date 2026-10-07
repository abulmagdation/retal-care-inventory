FROM node:22-bookworm-slim AS build

WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci

COPY client/ client/
RUN npm run build

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=8080
WORKDIR /app

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --omit=dev --workspace=server --include-workspace-root && npm cache clean --force

COPY server/src/ server/src/
COPY --from=build /app/client/dist/ client/dist/

USER node
EXPOSE 8080
CMD ["node", "server/src/index.js"]
