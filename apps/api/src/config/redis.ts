import Redis from 'ioredis';

let redisClient: Redis;

const connectRedis = async (): Promise<void> => {
  const url = process.env.REDIS_URL;
  if (!url) throw new Error('REDIS_URL is not defined');

  redisClient = new Redis(url, {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });

  await redisClient.connect();

  redisClient.on('error', (err) => console.error('❌ Redis error:', err));
  redisClient.on('reconnecting', () => console.warn('⚠️  Redis reconnecting...'));
};

export const getRedis = (): Redis => {
  if (!redisClient) throw new Error('Redis not initialized. Call connectRedis() first.');
  return redisClient;
};

export default connectRedis;
