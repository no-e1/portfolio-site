import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { HobbiesController } from './hobbies.controller';
import { HobbiesService } from './hobbies.service';

@Module({
  imports: [AuthModule],
  controllers: [HobbiesController],
  providers: [HobbiesService],
})
export class HobbiesModule {}
