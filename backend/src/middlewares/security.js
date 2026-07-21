const rateLimit = require('express-rate-limit');

const allowedOrigins = () =>
  (process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const corsOptions = {
  origin(origin, callback) {
    // Requests without an Origin are server-to-server, health checks, or local tools.
    if (!origin || allowedOrigins().includes(origin)) return callback(null, true);
    return callback(new Error('Origin is not allowed by CORS'));
  },
  credentials: true,
};

const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.API_RATE_LIMIT || 300),
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, result: null, message: 'Too many requests. Please try again later.' },
});

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  // Count failed authentication attempts only; successful login/reset calls must not consume the budget.
  limit: Number(process.env.AUTH_RATE_LIMIT || 50),
  skipSuccessfulRequests: true,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { success: false, result: null, message: 'Too many authentication attempts. Please try again later.' },
});

const securityHeaders = (req, res, next) => {
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'no-referrer',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });
  next();
};

const requestLogger = (req, res, next) => {
  const startedAt = Date.now();
  res.on('finish', () => {
    console.log(JSON.stringify({ level: 'info', event: 'http_request', method: req.method, path: req.path, status: res.statusCode, durationMs: Date.now() - startedAt }));
  });
  next();
};

module.exports = { corsOptions, apiRateLimit, authRateLimit, securityHeaders, requestLogger };
