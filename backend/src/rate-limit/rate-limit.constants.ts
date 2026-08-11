import { hours, minutes } from '@nestjs/throttler';

export type RateLimitWindow = {
  limit: number;
  ttl: number;
};

export type RateLimitProfile = {
  short: RateLimitWindow;
  long: RateLimitWindow;
};

function createProfile(
  shortLimit: number,
  shortTtl: number,
  longLimit: number,
  longTtl: number,
): RateLimitProfile {
  return {
    short: { limit: shortLimit, ttl: shortTtl },
    long: { limit: longLimit, ttl: longTtl },
  };
}

export const RATE_LIMIT_ERROR_MESSAGE = 'Too many requests, try again later';

export const RATE_LIMIT_PROFILES = {
  default: createProfile(300, minutes(1), 3000, hours(1)),
  publicRead: createProfile(180, minutes(1), 1500, hours(1)),
  protectedRead: createProfile(180, minutes(1), 1500, hours(1)),
  mediaRead: createProfile(90, minutes(1), 600, hours(1)),
  publicLogin: createProfile(15, minutes(1), 100, hours(1)),
  adminLogin: createProfile(3, minutes(1), 20, hours(1)),
  archive: createProfile(5, minutes(10), 20, hours(1)),
  adminRead: createProfile(180, minutes(1), 1500, hours(1)),
  adminWrite: createProfile(60, minutes(1), 500, hours(1)),
  adminUpload: createProfile(15, minutes(10), 50, hours(1)),
  adminDelete: createProfile(30, minutes(10), 100, hours(1)),
} satisfies Record<string, RateLimitProfile>;
