import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function trimStringArray(value: unknown): unknown {
  if (!Array.isArray(value)) {
    return value;
  }

  const items: unknown[] = value;
  return items.map((item) => trimString(item));
}

export class SaveAboutSectionDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  heading!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  body!: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @Transform(({ value }) => trimStringArray(value as unknown))
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(100, { each: true })
  technologies?: string[];
}

export class SaveAboutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(10000)
  intro!: string;

  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => SaveAboutSectionDto)
  sections!: SaveAboutSectionDto[];
}
