import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

function trimString(value: unknown): unknown {
  return typeof value === 'string' ? value.trim() : value;
}

export class UploadPrivateDocumentDto {
  @Transform(({ value }) => trimString(value as unknown))
  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;
}
