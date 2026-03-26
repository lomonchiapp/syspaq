import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { PaymentMethod } from "@prisma/client";

export class PaymentAllocationDto {
  @ApiProperty({ example: "uuid" })
  @IsUUID()
  invoiceId!: string;

  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(0.01)
  amount!: number;
}

export class RecordPaymentDto {
  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  method!: PaymentMethod;

  @ApiProperty({ example: 250.0 })
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @ApiPropertyOptional({ example: "USD" })
  @IsOptional()
  @IsString()
  @MaxLength(3)
  currency?: string;

  @ApiPropertyOptional({ example: "REF-123456" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  reference?: string;

  @ApiPropertyOptional({ example: "Banco Popular" })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  bankName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiPropertyOptional({ description: "Branch where payment was collected" })
  @IsOptional()
  @IsUUID()
  branchId?: string;

  @ApiProperty({ type: [PaymentAllocationDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => PaymentAllocationDto)
  allocations!: PaymentAllocationDto[];
}
