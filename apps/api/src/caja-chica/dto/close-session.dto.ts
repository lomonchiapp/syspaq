import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class CloseSessionDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
