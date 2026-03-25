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
import { PaymentsService } from "./payments.service";
import { RecordPaymentDto } from "./dto/record-payment.dto";
import { ListPaymentsQueryDto } from "./dto/list-payments-query.dto";

@ApiTags("payments")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false })
@Controller("payments")
export class PaymentsController {
  constructor(
    private readonly payments: PaymentsService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Record a payment with invoice allocations" })
  async record(@Req() req: Request, @Body() dto: RecordPaymentDto) {
    const result = await this.payments.record(this.tenantId(req), dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "RECORD",
      resource: "Payment",
      resourceId: result.id,
      meta: { amount: dto.amount, method: dto.method },
    });
    return result;
  }

  @Get()
  @ApiOperation({ summary: "List payments (paginated)" })
  list(@Req() req: Request, @Query() query: ListPaymentsQueryDto) {
    return this.payments.list(this.tenantId(req), query.page, query.limit, {
      customerId: query.customerId,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payment detail" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.payments.findOne(this.tenantId(req), id);
  }
}
