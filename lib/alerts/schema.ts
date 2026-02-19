import type { AlertType, SentAlert, UserNotification } from '@prisma/client';

export type { AlertType, SentAlert, UserNotification };

export const ALERT_TYPES = {
  EMAIL_DIGEST: 'EMAIL_DIGEST',
  SLACK_REALTIME: 'SLACK_REALTIME',
  TELEGRAM_REALTIME: 'TELEGRAM_REALTIME',
} as const;

export type AlertTypeEnum = (typeof ALERT_TYPES)[keyof typeof ALERT_TYPES];

export const ALERT_RATE_LIMITS = {
  COOLDOWN_MINUTES: 15,
  DAILY_CAP: 10,
  IMMEDIATE_SCORE_THRESHOLD: 90,
  BATCHED_SCORE_THRESHOLD: 80,
} as const;

export const EMAIL_DIGEST_SETTINGS = {
  HOUR: 8,
  MAX_JOBS: 10,
  SCORE_TIERS: {
    EXCELLENT: { min: 90, label: 'Excellent matches' },
    GOOD: { min: 80, label: 'Good matches' },
  },
} as const;
