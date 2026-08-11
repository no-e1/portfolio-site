import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  AdminDeleteRateLimit,
  AdminReadRateLimit,
  AdminWriteRateLimit,
} from '../../rate-limit/rate-limit.decorators';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import {
  AdminUsersService,
  type CreatedUserResponse,
  type ManagedUserResponse,
} from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @AdminReadRateLimit()
  findAll(): Promise<ManagedUserResponse[]> {
    return this.adminUsersService.findAll();
  }

  @Post()
  @AdminWriteRateLimit()
  create(@Body() createUserDto: CreateUserDto): Promise<CreatedUserResponse> {
    return this.adminUsersService.create(createUserDto);
  }

  @Patch(':id')
  @AdminWriteRateLimit()
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<ManagedUserResponse> {
    return this.adminUsersService.update(id, updateUserDto);
  }

  @Patch(':id/activate')
  @AdminWriteRateLimit()
  activate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ManagedUserResponse> {
    return this.adminUsersService.setActive(id, true);
  }

  @Patch(':id/deactivate')
  @AdminWriteRateLimit()
  deactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ManagedUserResponse> {
    return this.adminUsersService.setActive(id, false);
  }

  @Delete(':id')
  @AdminDeleteRateLimit()
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ id: number; deleted: true }> {
    return this.adminUsersService.remove(id);
  }
}
