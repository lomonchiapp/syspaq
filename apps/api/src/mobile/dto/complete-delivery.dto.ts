import { IsOptional, IsString, IsObject } from "class-validator";

export class CompleteMobileDeliveryDto {
  @IsOptional()
  @IsString()
  signatureUrl?: string;

  @IsOptional()
  @IsString()
  signatureContact?: string;

  @IsOptional()
  @IsString()
  signatureIdType?: string;

  @IsOptional()
  @IsString()
  signatureId?: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  location?: { lat: number; lng: number };
}

export class FailMobileDeliveryDto {
  @IsString()
  failReason!: string;

  @IsOptional()
  @IsString()
  photoUrl?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsObject()
  location?: { lat: number; lng: number };
}
