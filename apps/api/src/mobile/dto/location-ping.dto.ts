import { IsArray, IsDateString, IsNumber, IsOptional, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

class PingItem {
  @IsNumber()
  lat!: number;

  @IsNumber()
  lng!: number;

  @IsOptional()
  @IsNumber()
  accuracy?: number;

  @IsOptional()
  @IsNumber()
  speed?: number;

  @IsOptional()
  @IsNumber()
  heading?: number;

  @IsDateString()
  recordedAt!: string;
}

export class LocationPingDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PingItem)
  pings!: PingItem[];
}
