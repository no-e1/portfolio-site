import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './login.dto';

export type LoginResponse = {
  accessToken: string;
  expiresIn: number;
};

const INVALID_CREDENTIALS = 'Benutzername oder Passwort ist falsch.';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const user = await this.prisma.user.findUnique({
      where: { username: loginDto.username },
      select: {
        id: true,
        username: true,
        passwordHash: true,
        isActive: true,
      },
    });

    if (!user?.isActive) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const passwordMatches = await this.verifyPassword(
      user.passwordHash,
      loginDto.password,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException(INVALID_CREDENTIALS);
    }

    const expiresIn = 3600;
    const accessToken = await this.jwtService.signAsync(
      {
        sub: user.id,
        username: user.username,
      },
      { expiresIn },
    );

    return {
      accessToken,
      expiresIn,
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
