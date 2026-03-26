import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";
import { Type } from "class-transformer";
import { VehicleType } from "@prisma/client";

export class CreateVehicleDto {
  @ApiProperty({ description: "Placa del vehículo" })
  @IsString()
  @MaxLength(20)
  plate!: string;

  @ApiProperty({ description: "Marca del vehículo" })
  @IsString()
  @MaxLength(50)
  brand!: string;

  @ApiProperty({ description: "Modelo del vehículo" })
  @IsString()
  @MaxLength(50)
  model!: string;

  @ApiPropertyOptional({ description: "Año del vehículo" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  year?: number;

  @ApiProperty({ description: "Tipo de vehículo", enum: VehicleType })
  @IsEnum(VehicleType)
  type!: VehicleType;

  @ApiPropertyOptional({ description: "Capacidad de peso en libras" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacityWeightLbs?: number;

  @ApiPropertyOptional({ description: "Capacidad de volumen en pies cúbicos" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  capacityVolumeCbft?: number;

  @ApiPropertyOptional({ description: "ID de la sucursal actual", format: "uuid" })
  @IsOptional()
  @IsUUID()
  currentBranchId?: string;

  @ApiPropertyOptional({ description: "Tipo de combustible" })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  fuelType?: string;
}
