import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class ExchangeTokenDto {
  @ApiProperty({ example: "spq_live_xxxxxxxx", description: "API key completa" })
  @IsString()
  @MinLength(16)
  apiKey!: string;
}
