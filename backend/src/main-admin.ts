import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { resolve } from 'path';
import { AdminModule } from './admin/admin.module';
import { configureApplication } from './bootstrap/configure-application';

export async function bootstrapAdminApplication(): Promise<void> {
  const app = await NestFactory.create<NestExpressApplication>(AdminModule);

  configureApplication(app);
  app.useStaticAssets(resolve(process.cwd(), 'uploads'), {
    prefix: '/uploads/',
  });

  await app.listen(process.env.ADMIN_PORT ?? 3001, '0.0.0.0');
}

if (require.main === module) {
  void bootstrapAdminApplication();
}
