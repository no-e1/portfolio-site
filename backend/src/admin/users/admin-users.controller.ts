import {
  Body,
  Controller,
  Delete,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminJwtAuthGuard } from '../auth/admin-jwt-auth.guard';
import {
  AdminUsersService,
  type CreatedUserResponse,
  type ManagedUserResponse,
} from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';

@UseGuards(AdminJwtAuthGuard)
@Controller('admin/users')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto): Promise<CreatedUserResponse> {
    return this.adminUsersService.create(createUserDto);
  }

  @Patch(':id/deactivate')
  deactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<ManagedUserResponse> {
    return this.adminUsersService.deactivate(id);
  }

  @Delete(':id')
  remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ id: number; deleted: true }> {
    return this.adminUsersService.remove(id);
  }
}
