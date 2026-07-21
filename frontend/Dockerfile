# Frontend - Invoice ERP CRM (React + Vite) served by Nginx
FROM node:20.9.0-alpine AS build

WORKDIR /app/frontend

# WSL2 / IPv6-broken networks: make Node prefer IPv4 so npm doesn't hang on IPv6
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# Backend URL baked into the build (browser talks to backend directly).
# Override with: --build-arg VITE_BACKEND_SERVER=http://your-host:8000/
ARG VITE_BACKEND_SERVER=http://localhost:8000/
ARG VITE_FILE_BASE_URL=http://localhost:8000/

COPY frontend/package*.json ./
# Resilient install for flaky networks / slow mirrors
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci --no-audit --no-fund

COPY frontend ./

# Vite reads these from the environment at build time. PROD=true makes
# serverApiConfig.js use VITE_BACKEND_SERVER instead of localhost defaults.
ENV VITE_BACKEND_SERVER=$VITE_BACKEND_SERVER
ENV VITE_FILE_BASE_URL=$VITE_FILE_BASE_URL
ENV PROD=true

RUN npm run build

# --- Serve static build with Nginx ---
FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
