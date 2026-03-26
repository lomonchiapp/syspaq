import { ApiPropertyOptional } from "@nestjs/swagger";
import { TicketCategory, TicketPriority, TicketStatus } from "@prisma/client";
import { IsEnum, IsOptional, IsUUID } from "class-validator";

export class UpdateTicketDto {
  @ApiPropertyOptional({ enum: TicketStatus })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ enum: TicketCategory })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assignedToId?: string;
}
