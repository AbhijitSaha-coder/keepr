import { env } from '../config/env';

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, meta?: unknown): string {
  const timestamp = new Date().toISOString();
  const metaStr = meta ? ` | ${JSON.stringify(meta)}` : '';
  return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
}

export const logger = {
  info(message: string, meta?: unknown) {
    if (env.NODE_ENV !== 'test') {
      console.log(formatMessage('info', message, meta));
    }
  },
  warn(message: string, meta?: unknown) {
    if (env.NODE_ENV !== 'test') {
      console.warn(formatMessage('warn', message, meta));
    }
  },
  error(message: string, meta?: unknown) {
    console.error(formatMessage('error', message, meta));
  },
  debug(message: string, meta?: unknown) {
    if (env.NODE_ENV === 'development') {
      console.debug(formatMessage('debug', message, meta));
    }
  }
};
