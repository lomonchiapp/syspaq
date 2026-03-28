import { ApiProperty } from "@nestjs/swagger";
import { VoyageStatus } from "@prisma/client";
import { IsEnum } from "class-validator";

export class TransitionVoyageStatusDto {
  @ApiProperty({ enum: VoyageStatus })
  @IsEnum(VoyageStatus)
  status!: VoyageStatus;
}
