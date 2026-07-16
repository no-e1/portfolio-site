import { ProjectLinkType } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

function parseJson(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  try {
    return JSON.parse(value) as unknown;
  } catch {
    return value;
  }
}

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

function parseTags(value: unknown): unknown {
  if (typeof value === 'string' && !value.trim().startsWith('[')) {
    return [value.trim()];
  }

  const parsedValue = parseJson(value);

  if (!Array.isArray(parsedValue)) {
    return parsedValue;
  }

  const tags: unknown[] = parsedValue;

  return tags.map((tag) => trimString(tag));
}

function parseInteger(value: unknown): unknown {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  return Number(value);
}

function parseBoolean(value: unknown): unknown {
  if (value === 'true') {
    return true;
  }

  if (value === 'false') {
    return false;
  }

  return value;
}

export class CreateProjectLinkDto {
  @IsEnum(ProjectLinkType)
  type!: ProjectLinkType;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @MaxLength(2048)
  @Matches(/^(https?:\/\/|\/)[^\s]+$/)
  href!: string;
}

export class CreateProjectDto {
  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(191)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  shortDescription!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50000)
  longDescription!: string;

  @Transform(({ value }) => trimString(value))
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  period!: string;

  @IsOptional()
  @Transform(({ value }) => parseTags(value))
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  @MaxLength(60, { each: true })
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => parseJson(value))
  @IsArray()
  @ArrayMaxSize(10)
  @ValidateNested({ each: true })
  @Type(() => CreateProjectLinkDto)
  links?: CreateProjectLinkDto[];

  @IsOptional()
  @Transform(({ value }) => parseInteger(value))
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @Transform(({ value }) => parseBoolean(value))
  @IsBoolean()
  isPublished?: boolean;
}
