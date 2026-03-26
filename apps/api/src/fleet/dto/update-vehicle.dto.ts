import { ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "@nestjs/swagger";
import { IsEnum, IsNumber, IsOptional } from "class-validator";
import { Type } from "class-transformer";
import { VehicleStatus } from "@prisma/client";
import { CreateVehicleDto } from "./create-vehicle.dto";

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {
  @ApiPropertyOptional({ description: "Estado del vehículo", enum: VehicleStatus })
  @IsOptional()
  @IsEnum(VehicleStatus)
  status?: VehicleStatus;

  @ApiPropertyOptional({ description: "Kilometraje actual" })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  mileage?: number;
}
