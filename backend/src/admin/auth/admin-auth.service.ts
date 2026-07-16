import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { ADMIN_TOKEN_EXPIRES_IN } from './admin.constants';
import { AdminLoginDto } from './dto/admin-login.dto';

export type AdminLoginResponse = {
  accessToken: string;
  expiresIn: number;
};

const INVALID_CREDENTIALS = 'Benutzername oder Passwort ist falsch.';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: AdminLoginDto): Promise<AdminLoginResponse> {
    const adminUser = await this.prisma.adminUser.findUnique({
      where: { username: loginDto.username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!adminUser?.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordMatches = await this.verifyPassword(
      adminUser.passwordHash,
      loginDto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const accessToken = await this.jwtService.signAsync({
      sub: adminUser.id,
      username: adminUser.username,
      role: 'admin',
    });

    return {
      accessToken,
      expiresIn: ADMIN_TOKEN_EXPIRES_IN,
    };
  }

  private async verifyPassword(
    passwordHash: string,
    password: string,
  ): Promise<boolean> {
    try {
      return await argon2.verify(passwordHash, password);
    } catch {
      return false;
    }
  }
}
