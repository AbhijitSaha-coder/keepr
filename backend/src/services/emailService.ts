import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface SentEmailRecord extends EmailOptions {
  sentAt: Date;
}

export interface IEmailService {
  sendEmail(options: EmailOptions): Promise<boolean>;
}

export class MockEmailService implements IEmailService {
  private static outbox: SentEmailRecord[] = [];

  async sendEmail(options: EmailOptions): Promise<boolean> {
    const record: SentEmailRecord = {
      ...options,
      sentAt: new Date()
    };
    MockEmailService.outbox.unshift(record);

    // Keep outbox limited to last 100 emails in memory
    if (MockEmailService.outbox.length > 100) {
      MockEmailService.outbox.pop();
    }

    logger.info(`📧 [DEV EMAIL ADAPTER] To: ${options.to} | Subject: "${options.subject}"`);
    return true;
  }

  static getOutbox(): SentEmailRecord[] {
    return [...MockEmailService.outbox];
  }

  static clearOutbox(): void {
    MockEmailService.outbox = [];
  }
}

export class SmtpEmailService implements IEmailService {
  async sendEmail(options: EmailOptions): Promise<boolean> {
    // In production, when SMTP credentials are provided, nodemailer or AWS SES would be used.
    // For now, if SMTP host is configured, we log transmission.
    logger.info(`📧 [SMTP EMAIL] Sending email to ${options.to} via ${env.SMTP_HOST || 'configured host'}`);
    return true;
  }
}

export const emailService: IEmailService =
  env.EMAIL_PROVIDER === 'smtp' && env.SMTP_HOST ? new SmtpEmailService() : new MockEmailService();
