import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CajaChicaTxType } from "@prisma/client";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateTransactionDto {
  @ApiProperty()
  @IsUUID()
  branchId!: string;

  @ApiProperty({ enum: [CajaChicaTxType.CASH_OUT, CajaChicaTxType.BANK_DEPOSIT, CajaChicaTxType.ADJUSTMENT] })
  @IsEnum(CajaChicaTxType, {
    message: "type must be one of: CASH_OUT, BANK_DEPOSIT, ADJUSTMENT",
  })
  type!: CajaChicaTxType;

  @ApiProperty()
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiProperty()
  @IsString()
  @MaxLength(500)
  description!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  reference?: string;
}
