import { Transform } from 'class-transformer';
import { PrivateDocumentType } from '@prisma/client';
import { IsEnum, IsString, MaxLength, MinLength } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UploadPrivateDocumentDto {
  @IsEnum(PrivateDocumentType)
  type!: PrivateDocumentType;

  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;
}
