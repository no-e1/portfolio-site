import { Transform } from 'class-transformer';
import { IsString, MaxLength } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class SaveHobbyPageDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(5000)
  introduction!: string;
}
