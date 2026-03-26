import { ApiPropertyOptional } from "@nestjs/swagger";
import { PartialType } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";
import { DriverStatus } from "@prisma/client";
import { CreateDriverDto } from "./create-driver.dto";

export class UpdateDriverDto extends PartialType(CreateDriverDto) {
  @ApiPropertyOptional({ description: "Estado del conductor", enum: DriverStatus })
  @IsOptional()
  @IsEnum(DriverStatus)
  status?: DriverStatus;
}
