import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { FiscalSequenceType } from "@prisma/client";
import { IsDateString, IsEnum, IsOptional, IsString } from "class-validator";

export class CreateSequenceDto {
  @ApiProperty({ enum: FiscalSequenceType, example: "B01" })
  @IsEnum(FiscalSequenceType)
  type!: FiscalSequenceType;

  @ApiProperty({ example: "B010010011" })
  @IsString()
  prefix!: string;

  @ApiPropertyOptional({ example: "A010010011234" })
  @IsOptional()
  @IsString()
  authorizationNumber?: string;

  @ApiProperty({ example: "2026-01-01" })
  @IsDateString()
  validFrom!: string;

  @ApiProperty({ example: "2026-12-31" })
  @IsDateString()
  validUntil!: string;
}
