import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class CreateTransferDto {
  @ApiProperty({ example: "TRF-2026-0001", maxLength: 30 })
  @IsString()
  @MaxLength(30)
  number!: string;

  @ApiProperty({ example: "uuid" })
  @IsUUID()
  originBranchId!: string;

  @ApiProperty({ example: "uuid" })
  @IsUUID()
  destBranchId!: string;

  @ApiPropertyOptional({ maxLength: 1000 })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;
}
