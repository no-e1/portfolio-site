import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

export type CreatedUserResponse = {
  id: number;
  username: string;
  isActive: boolean;
  loginCount: number;
  createdAt: Date;
  updatedAt: Date;
};

export type ManagedUserResponse = CreatedUserResponse;

@Injectable()
export class AdminUsersService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(): Promise<ManagedUserResponse[]> {
    return this.prisma.user.findMany({
      orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
      select: {
        id: true,
        username: true,
        isActive: true,
        loginCount: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async create(createUserDto: CreateUserDto): Promise<CreatedUserResponse> {
    const passwordHash = await argon2.hash(createUserDto.password, {
      type: argon2.argon2id,
    });

    try {
      return await this.prisma.user.create({
        data: {
          username: createUserDto.username,
          passwordHash,
        },
        select: {
          id: true,
          username: true,
          isActive: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Der Benutzername existiert bereits.');
      }

      throw error;
    }
  }

  async update(
    id: number,
    updateUserDto: UpdateUserDto,
  ): Promise<ManagedUserResponse> {
    this.ensureValidId(id);

    if (
      updateUserDto.username === undefined &&
      updateUserDto.password === undefined
    ) {
      throw new BadRequestException('Keine Änderung angegeben.');
    }

    const passwordHash =
      updateUserDto.password === undefined
        ? undefined
        : await argon2.hash(updateUserDto.password, {
            type: argon2.argon2id,
          });

    try {
      return await this.prisma.user.update({
        where: { id },
        data: {
          username: updateUserDto.username,
          passwordHash,
        },
        select: {
          id: true,
          username: true,
          isActive: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Der Benutzername existiert bereits.');
      }

      this.handleNotFound(error);
      throw error;
    }
  }

  async setActive(id: number, isActive: boolean): Promise<ManagedUserResponse> {
    this.ensureValidId(id);

    try {
      return await this.prisma.user.update({
        where: { id },
        data: { isActive },
        select: {
          id: true,
          username: true,
          isActive: true,
          loginCount: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } catch (error) {
      this.handleNotFound(error);
      throw error;
    }
  }

  async remove(id: number): Promise<{ id: number; deleted: true }> {
    this.ensureValidId(id);

    try {
      await this.prisma.user.delete({ where: { id } });
    } catch (error) {
      this.handleNotFound(error);
      throw error;
    }

    return { id, deleted: true };
  }

  private ensureValidId(id: number): void {
    if (id < 1) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }
  }

  private handleNotFound(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      throw new NotFoundException('Benutzer nicht gefunden.');
    }
  }
}
