import { ApiPropertyOptional } from "@nestjs/swagger";
import { ShippingMode, VoyageStatus } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class ListVoyagesQueryDto {
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

  @ApiPropertyOptional({ enum: VoyageStatus })
  @IsOptional()
  @IsEnum(VoyageStatus)
  status?: VoyageStatus;

  @ApiPropertyOptional({ enum: ShippingMode })
  @IsOptional()
  @IsEnum(ShippingMode)
  mode?: ShippingMode;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrier?: string;
}
