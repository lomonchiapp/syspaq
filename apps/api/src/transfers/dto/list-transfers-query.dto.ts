import { ApiPropertyOptional } from "@nestjs/swagger";
import { TransferStatus, TransferType } from "@prisma/client";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from "class-validator";

export class ListTransfersQueryDto {
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

  @ApiPropertyOptional({ enum: TransferStatus })
  @IsOptional()
  @IsEnum(TransferStatus)
  status?: TransferStatus;

  @ApiPropertyOptional({ enum: TransferType })
  @IsOptional()
  @IsEnum(TransferType)
  type?: TransferType;

  @ApiPropertyOptional({ description: "Filter by origin OR destination branch" })
  @IsOptional()
  @IsUUID()
  branchId?: string;
}
