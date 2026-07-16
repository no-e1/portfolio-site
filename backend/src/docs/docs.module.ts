import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DocsController } from './docs.controller';
import { DocsService } from './docs.service';

@Module({
  imports: [AuthModule],
  controllers: [DocsController],
  providers: [DocsService],
})
export class DocsModule {}
