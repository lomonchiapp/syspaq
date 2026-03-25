import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsISO8601, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { BillingMethod } from "@prisma/client";

export class RecordPaymentDto {
  @ApiProperty({ example: 7900 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: "DOP" })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ enum: BillingMethod })
  @IsEnum(BillingMethod)
  method!: BillingMethod;

  @ApiPropertyOptional({ example: "TXN-123456" })
  @IsOptional()
  @IsString()
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  periodStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  periodEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsISO8601()
  paidAt?: string;
}
