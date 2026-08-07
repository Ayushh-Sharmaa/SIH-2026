export const RATE_LIMIT_CONFIG = {
  auth: {
    maxIpFailures: parseInt(process.env.AUTH_MAX_IP_FAILURES || '5', 10),
    maxAccountFailures: parseInt(process.env.AUTH_MAX_ACCOUNT_FAILURES || '3', 10),
    baseBackoffMs: parseInt(process.env.AUTH_BASE_BACKOFF_MS || '30000', 10), // 30s base backoff
    backoffMultiplier: parseFloat(process.env.AUTH_BACKOFF_MULTIPLIER || '2'),
    maxBackoffMs: parseInt(process.env.AUTH_MAX_BACKOFF_MS || '3600000', 10), // 1 hour max lockout
    ipLimit: parseInt(process.env.AUTH_IP_LIMIT || '20', 10),
    ipWindowMs: parseInt(process.env.AUTH_IP_WINDOW_MS || '60000', 10),
  },
  public: {
    limit: parseInt(process.env.PUBLIC_LIMIT || '60', 10),
    windowMs: parseInt(process.env.PUBLIC_WINDOW_MS || '60000', 10),
  },
  authenticated: {
    limit: parseInt(process.env.AUTH_USER_LIMIT || '200', 10),
    windowMs: parseInt(process.env.AUTH_USER_WINDOW_MS || '60000', 10),
  }
};
