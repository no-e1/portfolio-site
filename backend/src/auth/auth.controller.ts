import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { PublicLoginRateLimit } from '../rate-limit/rate-limit.decorators';
import { AuthService, type LoginResponse } from './auth.service';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @PublicLoginRateLimit()
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }
}
