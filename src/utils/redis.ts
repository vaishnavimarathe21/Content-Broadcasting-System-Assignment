import Redis from 'ioredis';
import { config } from '../config';

// Redis Client configuration for /content/live API
const redis = new Redis(config.redisUrl, {
  maxRetriesPerRequest: 3,
  lazyConnect: true,
});

redis.on('connect', () => console.log('Redis connected successfully'));
redis.on('error', (err) => console.warn('Redis connection error (caching disabled):', err.message));

// Try to connect, but don't crash if Redis is unavailable
redis.connect().catch(() => {
  console.warn('Redis not available — running without cache');
});

const CACHE_TTL = 60; // Cache for 60 seconds (1 minute)

// Get cached data
export const getCache = async (key: string): Promise<string | null> => {
  try {
    if (redis.status !== 'ready') return null;
    return await redis.get(key);
  } catch {
    return null;
  }
};

// Set cache with TTL
export const setCache = async (key: string, data: any): Promise<void> => {
  try {
    if (redis.status !== 'ready') return;
    await redis.setex(key, CACHE_TTL, JSON.stringify(data));
  } catch {
    // Silently fail if cache is unavailable
  }
};

// Invalidate cache for a specific teacher (called when content is approved/rejected)
export const invalidateTeacherCache = async (teacherId: string): Promise<void> => {
  try {
    if (redis.status !== 'ready') return;
    const keys = await redis.keys(`live:${teacherId}:*`);
    if (keys.length > 0) await redis.del(...keys);
  } catch {
    // Silently fail
  }
};

export default redis;
