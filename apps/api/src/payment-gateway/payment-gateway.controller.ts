import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ActorType } from "@prisma/client";
import { Request } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { CustomerAuth } from "@/common/decorators/customer-auth-context.decorator";
import { CustomerAuthGuard } from "@/common/guards/customer-auth.guard";
import { AuditService } from "@/common/audit/audit.service";
import { PaymentGatewayService } from "./payment-gateway.service";
import { CreatePaymentIntentDto } from "./dto/create-payment-intent.dto";
import { ListPaymentIntentsQueryDto } from "./dto/list-payment-intents-query.dto";

/* -------------------------------------------------------------------- */
/*  Customer-facing endpoints                                            */
/* -------------------------------------------------------------------- */

@ApiTags("customers / self-service")
@Public()
@UseGuards(CustomerAuthGuard)
@ApiHeader({ name: "Authorization", required: true, description: "Customer Bearer token" })
@Controller("customers/me/payment-intents")
export class CustomerPaymentIntentsController {
  constructor(
    private readonly gateway: PaymentGatewayService,
    private readonly audit: AuditService,
  ) {}

  @Post()
  @ApiOperation({ summary: "Create a payment intent for an invoice" })
  async create(
    @CustomerAuth() auth: { tenantId: string; customerId: string },
    @Body() dto: CreatePaymentIntentDto,
  ) {
    const result = await this.gateway.createIntent(
      auth.tenantId,
      auth.customerId,
      dto,
    );
    this.audit.log({
      tenantId: auth.tenantId,
      actor: auth.customerId,
      actorType: ActorType.CUSTOMER,
      action: "CREATE",
      resource: "PaymentIntent",
      resourceId: result.paymentIntentId,
      meta: { gateway: dto.gateway, invoiceId: dto.invoiceId },
    });
    return result;
  }
}

/* -------------------------------------------------------------------- */
/*  Operator-facing endpoints                                            */
/* -------------------------------------------------------------------- */

@ApiTags("payment-intents")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false })
@Controller("payment-intents")
export class PaymentIntentsController {
  constructor(
    private readonly gateway: PaymentGatewayService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Get()
  @ApiOperation({ summary: "List payment intents (paginated)" })
  list(@Req() req: Request, @Query() query: ListPaymentIntentsQueryDto) {
    return this.gateway.list(this.tenantId(req), query.page, query.limit, {
      customerId: query.customerId,
      gateway: query.gateway,
      status: query.status,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Get payment intent detail" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.gateway.findOne(this.tenantId(req), id);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancel a payment intent" })
  async cancel(@Req() req: Request, @Param("id") id: string) {
    const result = await this.gateway.cancel(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "CANCEL",
      resource: "PaymentIntent",
      resourceId: id,
    });
    return result;
  }
}
