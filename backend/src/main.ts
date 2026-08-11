import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import { AdminModule } from './admin/admin.module';
import { AppModule } from './app.module';

function configureApplication(app: NestExpressApplication): void {
  app.set('trust proxy', 1);
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
}

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const adminApp =
    await NestFactory.create<NestExpressApplication>(AdminModule);

  configureApplication(app);
  configureApplication(adminApp);

  app.useStaticAssets(resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });
  adminApp.useStaticAssets(resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await Promise.all([
    app.listen(process.env.PORT ?? 3000),
    adminApp.listen(process.env.ADMIN_PORT ?? 3001),
  ]);
}
void bootstrap();
