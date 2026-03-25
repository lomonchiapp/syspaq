import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString, MinLength, MaxLength, Matches } from "class-validator";

export class SignupDto {
  @ApiProperty({ example: "Mi Courier SRL" })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  companyName!: string;

  @ApiProperty({ example: "mi-courier", description: "Slug único para el tenant (letras, números, guiones)" })
  @IsString()
  @MinLength(3)
  @MaxLength(40)
  @Matches(/^[a-z0-9-]+$/, { message: "El slug solo puede contener letras minúsculas, números y guiones" })
  slug!: string;

  @ApiProperty({ example: "admin@micourier.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "Juan" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  firstName!: string;

  @ApiProperty({ example: "Pérez" })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  lastName!: string;

  @ApiProperty({ example: "MiContraseña123!", minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  password!: string;
}
