import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: env.NODE_ENV === 'test',
  retryStrategy(times) {
    if (env.NODE_ENV === 'test') return null; // do not reconnect indefinitely in tests
    return Math.min(times * 100, 3000);
  }
});

redis.on('connect', () => {
  if (env.NODE_ENV !== 'test') {
    console.log('✅ Connected to Redis server');
  }
});

redis.on('error', (err) => {
  if (env.NODE_ENV !== 'test') {
    console.error('⚠️ Redis connection error:', err.message);
  }
});
