import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function parseTags(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((tag) => trimString(tag));
  }

  if (typeof value !== 'string') {
    return value;
  }

  try {
    const parsedValue = JSON.parse(value) as unknown;
    return Array.isArray(parsedValue)
      ? parsedValue.map((tag) => trimString(tag))
      : parsedValue;
  } catch {
    return value
      .split(',')
      .map((tag) => tag.trim())
      .filter(Boolean);
  }
}

export class SaveHobbySectionDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  description!: string;

  @Transform(({ value }) => parseTags(value))
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(60, { each: true })
  tags!: string[];
}
