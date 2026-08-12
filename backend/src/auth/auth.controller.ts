import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { PublicLoginRateLimit } from '../rate-limit/rate-limit.decorators';
import { UsernameThrottlerGuard } from '../rate-limit/rate-limit.guards';
import { AuthService, type LoginResponse } from './auth.service';
import { LoginDto } from './login.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @PublicLoginRateLimit()
  @UseGuards(UsernameThrottlerGuard)
  login(@Body() loginDto: LoginDto): Promise<LoginResponse> {
    return this.authService.login(loginDto);
  }
}
