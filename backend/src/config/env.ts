import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(val => parseInt(val, 10)).default('5001'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  DATABASE_URL: z.string(),
  TEST_DATABASE_URL: z.string().optional(),
  REDIS_URL: z.string().default('redis://127.0.0.1:6379'),
  JWT_SECRET: z.string().min(16).default('keepr_super_secret_jwt_key_production_grade_random_2026_xYz'),
  JWT_REFRESH_SECRET: z.string().min(16).default('keepr_super_secret_refresh_jwt_key_production_grade_random_2026_aBc'),
  SESSION_SECRET: z.string().min(16).default('keepr_session_secret_hmac_sign_2026'),
  SIGNED_URL_SECRET: z.string().min(16).default('keepr_signed_url_token_hmac_secret_2026'),
  STORAGE_DRIVER: z.enum(['local', 's3']).default('local'),
  STORAGE_LOCAL_DIR: z.string().default(path.resolve(__dirname, '../../uploads')),
  MAX_FILE_SIZE_MB: z.string().transform(val => parseInt(val, 10)).default('15'),
  EMAIL_PROVIDER: z.enum(['mock', 'smtp']).default('mock'),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(val => (val ? parseInt(val, 10) : 587)).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  FROM_EMAIL: z.string().default('notifications@keepr.app')
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
