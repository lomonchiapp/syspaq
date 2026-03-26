import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { TicketCategory, TicketPriority } from "@prisma/client";
import {
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from "class-validator";

export class CreateTicketDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  customerId?: string;

  @ApiProperty({ example: "Paquete no recibido" })
  @IsString()
  @MaxLength(200)
  subject!: string;

  @ApiProperty({ example: "Mi paquete no ha llegado después de 10 días" })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: TicketCategory, default: TicketCategory.GENERAL })
  @IsOptional()
  @IsEnum(TicketCategory)
  category?: TicketCategory = TicketCategory.GENERAL;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority = TicketPriority.MEDIUM;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  shipmentId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  invoiceId?: string;
}
