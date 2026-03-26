import { IsString, IsUUID, MinLength } from "class-validator";

export class DriverLoginDto {
  @IsString()
  phone!: string;

  @IsString()
  @MinLength(4)
  pin!: string;

  @IsUUID()
  tenantId!: string;
}
