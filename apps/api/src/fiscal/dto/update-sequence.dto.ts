import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsDateString, IsOptional } from "class-validator";

export class UpdateSequenceDto {
  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ example: "2027-06-30" })
  @IsOptional()
  @IsDateString()
  validUntil?: string;
}
