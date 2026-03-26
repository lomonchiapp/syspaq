import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class RouteStopDto {
  @ApiProperty({ description: "ID de la orden de entrega", format: "uuid" })
  @IsUUID()
  deliveryOrderId!: string;

  @ApiProperty({ description: "Secuencia de la parada", minimum: 1 })
  @IsInt()
  @Min(1)
  sequence!: number;
}

export class CreateRouteDto {
  @ApiProperty({ description: "ID del conductor", format: "uuid" })
  @IsUUID()
  driverId!: string;

  @ApiPropertyOptional({ description: "ID del vehículo", format: "uuid" })
  @IsOptional()
  @IsUUID()
  vehicleId?: string;

  @ApiProperty({ description: "ID de la sucursal de origen", format: "uuid" })
  @IsUUID()
  branchId!: string;

  @ApiProperty({ description: "Fecha planificada (ISO)" })
  @IsDateString()
  plannedDate!: string;

  @ApiProperty({ description: "Paradas de la ruta", type: [RouteStopDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RouteStopDto)
  stops!: RouteStopDto[];

  @ApiPropertyOptional({ description: "Notas adicionales" })
  @IsOptional()
  @IsString()
  notes?: string;
}
