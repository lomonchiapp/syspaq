import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsString, Min } from "class-validator";

export class ReconcileSessionDto {
  @ApiProperty()
  @IsNumber()
  @Min(0)
  physicalCount!: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
