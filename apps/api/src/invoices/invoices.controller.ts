import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ActorType } from "@prisma/client";
import { Request } from "express";
import { AuditService } from "@/common/audit/audit.service";
import { InvoicesService } from "./invoices.service";
import { CreateInvoiceDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { AddInvoiceItemDto } from "./dto/add-invoice-item.dto";
import { ListInvoicesQueryDto } from "./dto/list-invoices-query.dto";

@ApiTags("invoices")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false })
@Controller("invoices")
export class InvoicesController {
  constructor(
    private readonly invoices: InvoicesService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Create a new invoice" })
  async create(@Req() req: Request, @Body() dto: CreateInvoiceDto) {
    const result = await this.invoices.create(this.tenantId(req), dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "CREATE",
      resource: "Invoice",
      resourceId: result.id,
      meta: { number: result.number },
    });
    return result;
  }

  @Get()
  @ApiOperation({ summary: "List invoices (paginated)" })
  list(@Req() req: Request, @Query() query: ListInvoicesQueryDto) {
    return this.invoices.list(this.tenantId(req), query.page, query.limit, {
      customerId: query.customerId,
      status: query.status,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }

  @Get("customer-balance/:customerId")
  @ApiOperation({ summary: "Get customer outstanding balance" })
  getCustomerBalance(
    @Req() req: Request,
    @Param("customerId") customerId: string,
  ) {
    return this.invoices.getCustomerBalance(this.tenantId(req), customerId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get invoice detail" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.invoices.findOne(this.tenantId(req), id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update invoice (DRAFT only)" })
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    const result = await this.invoices.update(this.tenantId(req), id, dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "UPDATE",
      resource: "Invoice",
      resourceId: id,
    });
    return result;
  }

  @Post(":id/items")
  @ApiOperation({ summary: "Add item to invoice (DRAFT only)" })
  async addItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AddInvoiceItemDto,
  ) {
    const result = await this.invoices.addItem(this.tenantId(req), id, dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "ADD_ITEM",
      resource: "Invoice",
      resourceId: id,
    });
    return result;
  }

  @Delete(":id/items/:itemId")
  @ApiOperation({ summary: "Remove item from invoice (DRAFT only)" })
  async removeItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("itemId") itemId: string,
  ) {
    const result = await this.invoices.removeItem(
      this.tenantId(req),
      id,
      itemId,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "REMOVE_ITEM",
      resource: "Invoice",
      resourceId: id,
      meta: { itemId },
    });
    return result;
  }

  @Post(":id/issue")
  @ApiOperation({ summary: "Issue invoice (DRAFT -> ISSUED)" })
  async issue(@Req() req: Request, @Param("id") id: string) {
    const result = await this.invoices.issue(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "ISSUE",
      resource: "Invoice",
      resourceId: id,
    });
    return result;
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel invoice" })
  async cancel(@Req() req: Request, @Param("id") id: string) {
    const result = await this.invoices.cancel(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "CANCEL",
      resource: "Invoice",
      resourceId: id,
    });
    return result;
  }

  @Post(":id/void")
  @ApiOperation({ summary: "Void invoice (creates automatic credit note)" })
  async void(@Req() req: Request, @Param("id") id: string) {
    const result = await this.invoices.void(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "VOID",
      resource: "Invoice",
      resourceId: id,
    });
    return result;
  }

  @Post("generate-from-receptions")
  @ApiOperation({ summary: "Generate invoice from reception charges" })
  async generateFromReceptions(
    @Req() req: Request,
    @Body() body: { customerId: string; receptionIds: string[] },
  ) {
    const result = await this.invoices.generateFromReceptions(
      this.tenantId(req),
      body.customerId,
      body.receptionIds,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "GENERATE_FROM_RECEPTIONS",
      resource: "Invoice",
      resourceId: result.id,
      meta: { receptionIds: body.receptionIds },
    });
    return result;
  }
}
