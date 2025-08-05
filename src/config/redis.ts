import { createClient, RedisClientType } from 'redis';
import { config } from '@/config/environment';
import { logger } from '@/utils/logger';

let redisClient: RedisClientType | null = null;
let redisAvailable = false;

export const connectRedis = async (): Promise<void> => {
  try {
    const clientConfig: any = {
      url: config.redis.url,
      socket: {
        reconnectStrategy: false, // Disable automatic reconnection
        connectTimeout: 3000,
      },
    };

    if (config.redis.password) {
      clientConfig.password = config.redis.password;
    }

    redisClient = createClient(clientConfig);

    // Set up event listeners before connecting
    redisClient.on('error', () => {
      // Silently handle Redis errors to avoid log spam
      if (redisAvailable) {
        logger.warn('🔴 Redis connection lost');
        redisAvailable = false;
      }
    });

    redisClient.on('ready', () => {
      logger.info('🔴 Redis connected successfully');
      redisAvailable = true;
    });

    // Try to connect with timeout
    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 3000)
      )
    ]);

  } catch (error) {
    logger.warn('Redis not available - continuing without Redis');
    redisClient = null;
    redisAvailable = false;
  }
};

export const getRedisClient = (): RedisClientType | null => {
  return redisAvailable ? redisClient : null;
};

export const isRedisAvailable = (): boolean => {
  return redisAvailable;
};

export const disconnectRedis = async (): Promise<void> => {
  try {
    if (redisClient && redisAvailable) {
      await redisClient.quit();
      logger.info('🔴 Redis disconnected successfully');
    }
    redisClient = null;
    redisAvailable = false;
  } catch (error) {
    logger.error('Error disconnecting from Redis:', error);
  }
};
