import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from "class-validator";
import { ApiRole } from "@prisma/client";

export class CreateUserDto {
  @ApiProperty({ example: "admin@example.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "securepass" })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: "John" })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: "Doe" })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({ enum: ApiRole, default: ApiRole.OPERATOR })
  @IsOptional()
  @IsEnum(ApiRole)
  role?: ApiRole;
}
