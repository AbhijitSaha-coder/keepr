import Redis from 'ioredis';
import { env } from './env';

export const redis = new Redis(env.REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  enableOfflineQueue: false,
  lazyConnect: env.NODE_ENV === 'test',
  connectTimeout: 2000,
  retryStrategy(times) {
    if (env.NODE_ENV === 'test') return null;
    if (times > 5) return null;
    return Math.min(times * 200, 1000);
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
