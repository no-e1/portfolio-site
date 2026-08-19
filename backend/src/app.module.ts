import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AboutModule } from './about/about.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { DocsModule } from './docs/docs.module';
import { HobbiesModule } from './hobbies/hobbies.module';
import { InterestsModule } from './interests/interests.module';
import { PrismaModule } from './prisma/prisma.module';
import { ProjectsModule } from './projects/projects.module';
import { RateLimitModule } from './rate-limit/rate-limit.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    RateLimitModule,
    PrismaModule,
    AuthModule,
    ProjectsModule,
    AboutModule,
    HobbiesModule,
    InterestsModule,
    DocsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
