import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ActorType } from "@prisma/client";
import { Request } from "express";
import { AuditService } from "@/common/audit/audit.service";
import { CreditNotesService } from "./credit-notes.service";
import { CreateCreditNoteDto } from "./dto/create-credit-note.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";

@ApiTags("credit-notes")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false })
@Controller("credit-notes")
export class CreditNotesController {
  constructor(
    private readonly creditNotes: CreditNotesService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Create a credit note" })
  async create(@Req() req: Request, @Body() dto: CreateCreditNoteDto) {
    const result = await this.creditNotes.create(this.tenantId(req), dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "CREATE",
      resource: "CreditNote",
      resourceId: result.id,
      meta: { number: result.number, invoiceId: dto.invoiceId },
    });
    return result;
  }

  @Get()
  @ApiOperation({ summary: "List credit notes (paginated)" })
  list(@Req() req: Request, @Query() query: ListInvoicesQueryDto) {
    return this.creditNotes.list(
      this.tenantId(req),
      query.page,
      query.limit,
    );
  }

  @Post(":id/issue")
  @ApiOperation({ summary: "Issue and apply credit note to invoice" })
  async issue(@Req() req: Request, @Param("id") id: string) {
    const result = await this.creditNotes.issue(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "ISSUE",
      resource: "CreditNote",
      resourceId: id,
    });
    return result;
  }
}
