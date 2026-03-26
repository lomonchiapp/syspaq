import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class ReportQueryDto {
  @ApiProperty({ example: "2026-03", description: "Period in YYYY-MM format" })
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "period must be in YYYY-MM format" })
  period!: string;
}
