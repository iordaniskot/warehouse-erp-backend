import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('3001').transform(Number),
  
  // Database
  MONGODB_URI: z.string().default('mongodb://localhost:27017/warehouse-erp'),
  MONGODB_DB_NAME: z.string().default('warehouse-erp'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  REDIS_PASSWORD: z.string().optional(),
  
  // JWT
  JWT_ACCESS_SECRET: z.string().default('your-super-secret-access-key-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('your-super-secret-refresh-key-change-in-production'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // Security
  BCRYPT_SALT_ROUNDS: z.string().default('12').transform(Number),
  RATE_LIMIT_WINDOW_MS: z.string().default('60000').transform(Number),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform(Number),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // Logging
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
  
  // API
  API_VERSION: z.string().default('v1'),
  API_PREFIX: z.string().default('/api'),
  
  // Swagger
  SWAGGER_ENABLED: z.string().default('true').transform(val => val === 'true'),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  
  database: {
    uri: env.MONGODB_URI,
    name: env.MONGODB_DB_NAME,
  },
  
  redis: {
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
  },
  
  jwt: {
    accessSecret: env.JWT_ACCESS_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    accessExpiresIn: env.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  security: {
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    rateLimitWindowMs: env.RATE_LIMIT_WINDOW_MS,
    rateLimitMaxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },
  
  cors: {
    origin: env.CORS_ORIGIN,
  },
  
  logging: {
    level: env.LOG_LEVEL,
  },
  
  api: {
    version: env.API_VERSION,
    prefix: env.API_PREFIX,
  },
  
  swagger: {
    enabled: env.SWAGGER_ENABLED,
  },
} as const;
