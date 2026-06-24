# Backend - InvoiceCRM (Node.js / Express)
# Debian-slim (glibc) is required so PhantomJS (used by html-pdf) can run and
# generate invoice/quote PDFs — the Alpine/musl image cannot execute it.
FROM node:20.9.0-slim

WORKDIR /app

# WSL2 / IPv6-broken networks: make Node prefer IPv4 so npm + outbound calls don't hang on IPv6
ENV NODE_OPTIONS=--dns-result-order=ipv4first

# System libraries PhantomJS needs + fonts (DejaVu covers Vietnamese diacritics).
# bzip2 is required so phantomjs-prebuilt can extract its .tar.bz2 during npm install.
RUN apt-get update \
  && apt-get install -y --no-install-recommends \
     bzip2 fontconfig libfreetype6 fonts-dejavu-core ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# Install dependencies first (better layer caching)
COPY package*.json ./
# Resilient install for flaky networks / slow mirrors
RUN npm config set fetch-retries 5 \
  && npm config set fetch-retry-mintimeout 20000 \
  && npm config set fetch-retry-maxtimeout 120000 \
  && npm install --omit=dev --no-audit --no-fund

# Copy source
COPY . .

# Ensure runtime folders exist (uploaded files + generated PDFs)
RUN mkdir -p src/public/download src/public/uploads

# Entrypoint waits for MongoDB, seeds DB on first run, then starts the server
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8888

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
