FROM node:20.9.0-slim

WORKDIR /app/backend

ENV NODE_OPTIONS=--dns-result-order=ipv4first

ENV PUPPETEER_SKIP_DOWNLOAD=true \
  PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
  chromium fontconfig libfreetype6 fonts-dejavu-core \
  fonts-liberation libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
  libdrm2 libgbm1 libasound2 libpangocairo-1.0-0 libxcomposite1 \
  libxdamage1 libxfixes3 libxrandr2 libxkbcommon0 ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY backend/package*.json ./

RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm ci --omit=dev --no-audit --no-fund

COPY backend ./

RUN mkdir -p src/public/download src/public/uploads

COPY backend/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh


RUN sed -i 's/\r$//' /usr/local/bin/docker-entrypoint.sh \
  && chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["docker-entrypoint.sh"]

CMD ["npm", "start"]
