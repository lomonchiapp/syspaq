import { ApiProperty } from "@nestjs/swagger";
import { IsUUID } from "class-validator";

export class LinkContainerDto {
  @ApiProperty({ example: "uuid-of-container" })
  @IsUUID()
  containerId!: string;
}
