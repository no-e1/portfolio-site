import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';
import { ADMIN_JWT_AUDIENCE, ADMIN_JWT_ISSUER } from './admin.constants';

export type AdminJwtPayload = {
  sub: number;
  username: string;
  role: 'admin';
  iat?: number;
  exp?: number;
};

export type AuthenticatedAdminRequest = Request & {
  user: AdminJwtPayload;
};

@Injectable()
export class AdminJwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context
      .switchToHttp()
      .getRequest<AuthenticatedAdminRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      const payload = await this.jwtService.verifyAsync<AdminJwtPayload>(
        token,
        {
          issuer: ADMIN_JWT_ISSUER,
          audience: ADMIN_JWT_AUDIENCE,
        },
      );

      if (
        !Number.isInteger(payload.sub) ||
        typeof payload.username !== 'string' ||
        payload.role !== 'admin'
      ) {
        throw new UnauthorizedException();
      }

      request.user = payload;
    } catch {
      throw new UnauthorizedException();
    }

    return true;
  }

  private extractBearerToken(request: Request): string | undefined {
    const authorization = request.headers.authorization;

    if (!authorization) {
      return undefined;
    }

    const [scheme, token, extra] = authorization.trim().split(/\s+/);

    if (scheme?.toLowerCase() !== 'bearer' || !token || extra) {
      return undefined;
    }

    return token;
  }
}
