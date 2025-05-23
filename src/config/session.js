const session = require('express-session');
const FileStore = require('session-file-store')(session);
const { createClient } = require('redis');
const RedisStore = require('connect-redis').default;

function initSession() {
  const isProduction = process.env.NODE_ENV === 'production';
  const sessionConfig = {
    secret: process.env.SESSION_SECRET || "tracklead-secret",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: isProduction,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 // 1 dia
    },
    name: 'tracklead.sid'
  };

  if (isProduction) {
    try {
      const redisUrl = process.env.urlrefis || process.env.REDIS_URL;
      if (!redisUrl) {
        throw new Error('Redis URL not found in environment variables');
      }

      const redisClient = createClient({ url: redisUrl });
      redisClient.connect().catch((err) => {
        console.error('Redis connection error:', err);
      });

      redisClient.on('error', (err) => {
        console.error('Redis error:', err);
      });

      redisClient.on('connect', () => {
        console.log('Connected to Redis');
      });

      return session({
        ...sessionConfig,
        store: new RedisStore({
          client: redisClient,
          disableTouch: false // True: não atualiza TTL a cada acesso; False: atualiza
        }),
      });
    } catch (error) {
      console.error('Failed to initialize Redis session store:', error);
      console.warn('Falling back to file store for sessions');
      return session({
        ...sessionConfig,
        store: new FileStore({
          path: './localdb/sessions',
          ttl: 86400,
          retries: 0
        })
      });
    }
  } else {
    return session({
      ...sessionConfig,
      store: new FileStore({
        path: './localdb/sessions',
        ttl: 86400,
        retries: 0
      })
    });
  }
}

module.exports = {
  initSession
};
