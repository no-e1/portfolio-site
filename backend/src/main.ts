import { bootstrapAdminApplication } from './main-admin';
import { bootstrapPublicApplication } from './main-public';

async function bootstrap() {
  await Promise.all([
    bootstrapPublicApplication(),
    bootstrapAdminApplication(),
  ]);
}
void bootstrap();
