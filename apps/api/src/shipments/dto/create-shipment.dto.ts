import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  MinLength,
} from "class-validator";

export class CreateShipmentDto {
  @ApiProperty({ example: "BLX-90001234" })
  @IsString()
  @MinLength(3)
  @MaxLength(64)
  trackingNumber!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(256)
  reference?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  senderName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  carrierName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  contentDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  pieces?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  weightLbs?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  lengthCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  widthCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  heightCm?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Type(() => Number)
  fobValue?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fobCurrency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  collectionType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  destBranchId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  warehouseLocation?: string;

  @ApiPropertyOptional({
    type: "object",
    additionalProperties: true,
    description: "Metadatos libres (JSON)",
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
