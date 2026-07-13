import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class ProjectsQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
