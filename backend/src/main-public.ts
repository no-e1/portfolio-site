import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import { AppModule } from './app.module';
import { configureApplication } from './bootstrap/configure-application';

export async function bootstrapPublicApplication(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  configureApplication(app);
  app.useStaticAssets(resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.PORT ?? 3000, '0.0.0.0');
}

if (require.main === module) {
  void bootstrapPublicApplication();
}
