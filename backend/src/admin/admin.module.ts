import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import {
  ADMIN_JWT_AUDIENCE,
  ADMIN_JWT_ISSUER,
  ADMIN_TOKEN_EXPIRES_IN,
} from './auth/admin.constants';
import { AdminJwtAuthGuard } from './auth/admin-jwt-auth.guard';
import { AdminProjectsController } from './projects/admin-projects.controller';
import { AdminProjectsService } from './projects/admin-projects.service';
import { AdminUsersController } from './users/admin-users.controller';
import { AdminUsersService } from './users/admin-users.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('ADMIN_JWT_SECRET'),
        signOptions: {
          expiresIn: ADMIN_TOKEN_EXPIRES_IN,
          issuer: ADMIN_JWT_ISSUER,
          audience: ADMIN_JWT_AUDIENCE,
        },
      }),
    }),
  ],
  controllers: [
    AdminAuthController,
    AdminUsersController,
    AdminProjectsController,
  ],
  providers: [
    AdminAuthService,
    AdminJwtAuthGuard,
    AdminUsersService,
    AdminProjectsService,
  ],
})
export class AdminModule {}
