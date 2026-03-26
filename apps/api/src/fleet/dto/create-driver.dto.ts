import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateDriverDto {
  @ApiProperty({ description: "Nombre del conductor" })
  @IsString()
  @MaxLength(100)
  firstName!: string;

  @ApiProperty({ description: "Apellido del conductor" })
  @IsString()
  @MaxLength(100)
  lastName!: string;

  @ApiProperty({ description: "Teléfono del conductor" })
  @IsString()
  @MaxLength(20)
  phone!: string;

  @ApiPropertyOptional({ description: "Correo electrónico" })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({ description: "Número de licencia" })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  licenseNumber?: string;

  @ApiPropertyOptional({ description: "Tipo de licencia" })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  licenseType?: string;

  @ApiPropertyOptional({ description: "ID del vehículo asignado", format: "uuid" })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;
}
