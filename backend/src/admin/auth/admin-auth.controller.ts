import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminLoginRateLimit } from '../../rate-limit/rate-limit.decorators';
import { UsernameThrottlerGuard } from '../../rate-limit/rate-limit.guards';
import {
  AdminAuthService,
  type AdminLoginResponse,
} from './admin-auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';

@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AdminLoginRateLimit()
  @UseGuards(UsernameThrottlerGuard)
  login(@Body() loginDto: AdminLoginDto): Promise<AdminLoginResponse> {
    return this.adminAuthService.login(loginDto);
  }
}
