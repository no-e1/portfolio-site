import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AboutController } from './about.controller';
import { AboutService } from './about.service';

@Module({
  imports: [AuthModule],
  controllers: [AboutController],
  providers: [AboutService],
})
export class AboutModule {}
