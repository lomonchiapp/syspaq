import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";

export enum IdDocType {
  CEDULA = "CEDULA",
  PASSPORT = "PASSPORT",
  RNC = "RNC",
  OTHER = "OTHER",
}

export class RegisterCustomerDto {
  @ApiProperty({ example: "john@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "SecureP@ss1", minLength: 8 })
  @IsString()
  @MinLength(8)
  password!: string;

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

  @ApiPropertyOptional({ description: "Preferred branch for pickup" })
  @IsOptional()
  @IsUUID()
  preferredBranchId?: string;
}
