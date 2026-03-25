import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsString } from "class-validator";

export class LoginUserDto {
  @ApiProperty({ example: "admin@syspaq-demo.com" })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: "demo1234" })
  @IsString()
  password!: string;
}
