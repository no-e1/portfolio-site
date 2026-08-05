import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminAboutController } from './about/admin-about.controller';
import { AdminAboutService } from './about/admin-about.service';
import { AdminAuthController } from './auth/admin-auth.controller';
import { AdminAuthService } from './auth/admin-auth.service';
import {
  ADMIN_JWT_AUDIENCE,
  ADMIN_JWT_ISSUER,
  ADMIN_TOKEN_EXPIRES_IN,
} from './auth/admin.constants';
import { AdminJwtAuthGuard } from './auth/admin-jwt-auth.guard';
import { AdminDocumentsController } from './documents/admin-documents.controller';
import { AdminDocumentsService } from './documents/admin-documents.service';
import { AdminPrivateDocumentsController } from './private-documents/admin-private-documents.controller';
import { AdminPrivateDocumentsService } from './private-documents/admin-private-documents.service';
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
    AdminAboutController,
    AdminAuthController,
    AdminDocumentsController,
    AdminPrivateDocumentsController,
    AdminUsersController,
    AdminProjectsController,
  ],
  providers: [
    AdminAboutService,
    AdminAuthService,
    AdminJwtAuthGuard,
    AdminDocumentsService,
    AdminPrivateDocumentsService,
    AdminUsersService,
    AdminProjectsService,
  ],
})
export class AdminModule {}
