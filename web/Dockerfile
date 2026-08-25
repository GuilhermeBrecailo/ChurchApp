FROM node:20-slim AS build

WORKDIR /usr/src/app

# node:20-slim bundles npm 10.8.2, which fails "npm ci" against a
# lockfileVersion 3 file written by npm 11 (optional-deps resolution
# differs). Pin npm to match what generates package-lock.json locally.
RUN npm install -g npm@11

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-slim AS runtime

WORKDIR /usr/src/app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

COPY --from=build /usr/src/app/.output ./.output

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
