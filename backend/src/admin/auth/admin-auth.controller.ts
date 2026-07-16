import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
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
  login(@Body() loginDto: AdminLoginDto): Promise<AdminLoginResponse> {
    return this.adminAuthService.login(loginDto);
  }
}
