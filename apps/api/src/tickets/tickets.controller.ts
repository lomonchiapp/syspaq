import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { TicketCommentAuthorType } from "@prisma/client";
import { Request } from "express";
import { TicketsService } from "./tickets.service";
import { CreateTicketDto } from "./dto/create-ticket.dto";
import { UpdateTicketDto } from "./dto/update-ticket.dto";
import { CreateCommentDto } from "./dto/create-comment.dto";
import { ListTicketsQueryDto } from "./dto/list-tickets-query.dto";

@ApiTags("tickets")
@Controller("tickets")
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  private actorId(req: Request): string {
    return req.auth!.userId || req.auth!.apiKeyId || "unknown";
  }

  @Post()
  @ApiOperation({ summary: "Create a new ticket" })
  create(@Req() req: Request, @Body() dto: CreateTicketDto) {
    return this.tickets.create(
      this.tenantId(req),
      dto,
      this.actorId(req),
      "Operador",
    );
  }

  @Get()
  @ApiOperation({ summary: "List tickets (paginated)" })
  list(@Req() req: Request, @Query() query: ListTicketsQueryDto) {
    return this.tickets.list(this.tenantId(req), query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get ticket statistics" })
  getStats(@Req() req: Request) {
    return this.tickets.getStats(this.tenantId(req));
  }

  @Get(":id")
  @ApiOperation({ summary: "Get ticket detail with comments" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.tickets.findOne(this.tenantId(req), id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update ticket fields" })
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateTicketDto,
  ) {
    return this.tickets.update(this.tenantId(req), id, dto);
  }

  @Post(":id/comments")
  @ApiOperation({ summary: "Add comment to ticket" })
  addComment(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.tickets.addComment(
      this.tenantId(req),
      id,
      dto,
      TicketCommentAuthorType.OPERATOR,
      this.actorId(req),
      "Operador",
    );
  }

  @Post(":id/assign")
  @ApiOperation({ summary: "Assign ticket to operator" })
  assign(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() body: { assignedToId: string },
  ) {
    return this.tickets.assign(
      this.tenantId(req),
      id,
      body.assignedToId,
      "Operador",
    );
  }

  @Post(":id/resolve")
  @ApiOperation({ summary: "Resolve ticket" })
  resolve(@Req() req: Request, @Param("id") id: string) {
    return this.tickets.resolve(this.tenantId(req), id, "Operador");
  }

  @Post(":id/close")
  @ApiOperation({ summary: "Close resolved ticket" })
  close(@Req() req: Request, @Param("id") id: string) {
    return this.tickets.close(this.tenantId(req), id, "Operador");
  }
}
