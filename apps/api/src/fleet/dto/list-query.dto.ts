import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

export class ListQueryDto {
  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: "Filtrar por estado" })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ description: "Fecha desde (ISO)", example: "2025-01-01" })
  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @ApiPropertyOptional({ description: "Fecha hasta (ISO)", example: "2025-12-31" })
  @IsOptional()
  @IsDateString()
  dateTo?: string;
}
