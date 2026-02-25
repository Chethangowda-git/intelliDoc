import Redis from 'ioredis';

// General purpose Redis client (for caching etc.)
export const redis = new Redis(process.env.REDIS_URL);

// BullMQ requires maxRetriesPerRequest: null — separate connection config
export const bullMQConnection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => console.log('✅ Redis connected'));
redis.on('error', (err) => console.error('❌ Redis error:', err.message));