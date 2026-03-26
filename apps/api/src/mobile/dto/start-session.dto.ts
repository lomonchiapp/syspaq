import { IsOptional, IsObject } from "class-validator";

export class StartSessionDto {
  @IsOptional()
  @IsObject()
  location?: { lat: number; lng: number };

  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, unknown>;
}
