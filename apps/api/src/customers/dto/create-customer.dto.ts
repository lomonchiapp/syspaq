import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { IdDocType } from "./register-customer.dto";

export class CreateCustomerDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "John", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ example: "Doe", maxLength: 100 })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiPropertyOptional({ example: "+1809555000" })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ enum: IdDocType })
  @IsOptional()
  @IsEnum(IdDocType)
  idType?: IdDocType;

  @ApiPropertyOptional({ example: "001-1234567-8", maxLength: 20 })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  idNumber?: string;

  @ApiPropertyOptional({
    example: "BLX-00042",
    description: "Override casillero (operator only)",
  })
  @IsOptional()
  @IsString()
  casillero?: string;

  @ApiPropertyOptional({ description: "Preferred branch for pickup" })
  @IsOptional()
  @IsUUID()
  preferredBranchId?: string;
}
