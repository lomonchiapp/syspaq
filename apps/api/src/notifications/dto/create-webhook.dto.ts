import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsArray,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from "class-validator";

export class CreateWebhookDto {
  @ApiProperty({ example: "https://example.com/webhooks/syspaq" })
  @IsString()
  @IsUrl({}, { message: "url must be a valid URL" })
  url!: string;

  @ApiProperty({
    example: ["shipment.delivered", "shipment.created"],
    description: "List of event names to subscribe to",
  })
  @IsArray()
  @IsString({ each: true })
  events!: string[];

  @ApiPropertyOptional({
    description: "HMAC secret (min 16 chars). Auto-generated if omitted.",
  })
  @IsOptional()
  @IsString()
  @MinLength(16)
  secret?: string;
}
