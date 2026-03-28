import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ShippingMode } from "@prisma/client";
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class CreateVoyageDto {
  @ApiProperty({ example: "VYG-2026-001", maxLength: 30 })
  @IsString()
  @MaxLength(30)
  number!: string;

  @ApiProperty({ enum: ShippingMode })
  @IsEnum(ShippingMode)
  mode!: ShippingMode;

  @ApiPropertyOptional({ example: "2026-04-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ example: "MIA" })
  @IsOptional()
  @IsString()
  origin?: string;

  @ApiPropertyOptional({ example: "SDQ" })
  @IsOptional()
  @IsString()
  destination?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  carrier?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  vesselName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  masterAwb?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  shipper?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  consignee?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notifyParty?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  agent?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: "2026-04-01T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  departureDate?: string;

  @ApiPropertyOptional({ example: "2026-04-10T00:00:00.000Z" })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;
}
