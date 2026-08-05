import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class LoginDto {
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  password!: string;
}
