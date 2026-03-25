import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsISO8601, IsOptional, IsString } from "class-validator";
import { PlanTier, PlanStatus } from "@prisma/client";

export class UpdateTenantDto {
  @ApiPropertyOptional({ enum: PlanTier })
  @IsOptional()
  @IsEnum(PlanTier)
  plan?: PlanTier;

  @ApiPropertyOptional({ enum: PlanStatus })
  @IsOptional()
  @IsEnum(PlanStatus)
  planStatus?: PlanStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  periodEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  adminNotes?: string;
}
