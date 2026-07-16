FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
# npm ci refuses to resolve platform-specific optional deps (Rollup's native
# binaries) that differ between the lockfile's origin platform and this
# container's -- npm install re-resolves them correctly for Linux instead.
RUN npm install

COPY . .

# Vite inlines env vars into the built bundle at build time, so this has to
# be a build ARG, not a runtime container env var -- override with
# `docker compose build --build-arg VITE_API_URL=...` if the backend isn't
# reachable at the default.
ARG VITE_API_URL=http://localhost:8000
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
