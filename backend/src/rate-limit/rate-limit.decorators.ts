import { Throttle } from '@nestjs/throttler';
import {
  RATE_LIMIT_PROFILES,
  type RateLimitProfile,
} from './rate-limit.constants';

function useRateLimit(
  profile: RateLimitProfile,
): MethodDecorator & ClassDecorator {
  return Throttle({
    short: { ...profile.short },
    long: { ...profile.long },
  });
}

export const PublicReadRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.publicRead);

export const ProtectedReadRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.protectedRead);

export const MediaReadRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.mediaRead);

export const PublicLoginRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.publicLogin);

export const AdminLoginRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.adminLogin);

export const ArchiveRateLimit = () => useRateLimit(RATE_LIMIT_PROFILES.archive);

export const AdminReadRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.adminRead);

export const AdminWriteRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.adminWrite);

export const AdminUploadRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.adminUpload);

export const AdminDeleteRateLimit = () =>
  useRateLimit(RATE_LIMIT_PROFILES.adminDelete);
