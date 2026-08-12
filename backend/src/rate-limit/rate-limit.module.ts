import { Global, Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import {
  RATE_LIMIT_ERROR_MESSAGE,
  RATE_LIMIT_PROFILES,
} from './rate-limit.constants';
import {
  UsernameThrottlerGuard,
  UserThrottlerGuard,
} from './rate-limit.guards';

@Global()
@Module({
  imports: [
    ThrottlerModule.forRoot({
      errorMessage: RATE_LIMIT_ERROR_MESSAGE,
      throttlers: [
        {
          name: 'short',
          ...RATE_LIMIT_PROFILES.default.short,
        },
        {
          name: 'long',
          ...RATE_LIMIT_PROFILES.default.long,
        },
      ],
    }),
  ],
  providers: [
    UsernameThrottlerGuard,
    UserThrottlerGuard,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [UsernameThrottlerGuard, UserThrottlerGuard],
})
export class RateLimitModule {}
