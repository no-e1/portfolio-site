import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function getNormalizedUsername(request: Record<string, unknown>): string {
  const body = request.body;

  if (!isRecord(body) || typeof body.username !== 'string') {
    return 'username:invalid';
  }

  const username = body.username.trim().toLowerCase();

  return username ? `username:value:${username}` : 'username:invalid';
}

@Injectable()
export class UsernameThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    return Promise.resolve(getNormalizedUsername(request));
  }
}

@Injectable()
export class UserThrottlerGuard extends ThrottlerGuard {
  protected getTracker(request: Record<string, unknown>): Promise<string> {
    const user = request.user;

    if (
      !isRecord(user) ||
      typeof user.sub !== 'number' ||
      !Number.isInteger(user.sub)
    ) {
      throw new UnauthorizedException();
    }

    return Promise.resolve(`user:id:${user.sub}`);
  }
}
