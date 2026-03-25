import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { randomBytes } from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { WebhookChannel } from "./channels/webhook.channel";
import { CreateWebhookDto } from "./dto/create-webhook.dto";
import { UpdateWebhookDto } from "./dto/update-webhook.dto";

@ApiTags("webhooks")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("webhooks")
export class WebhooksController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly webhookChannel: WebhookChannel
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Crear suscripcion de webhook" })
  create(@Req() req: Request, @Body() dto: CreateWebhookDto) {
    const tenantId = this.tenantId(req);
    const secret = dto.secret || randomBytes(32).toString("hex");

    return this.prisma.webhookSubscription.create({
      data: {
        tenantId,
        url: dto.url,
        events: dto.events,
        secret,
        isActive: true,
      },
    });
  }

  @Get()
  @ApiOperation({ summary: "Listar suscripciones de webhook" })
  list(@Req() req: Request) {
    const tenantId = this.tenantId(req);
    return this.prisma.webhookSubscription.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de suscripcion de webhook" })
  async findOne(@Req() req: Request, @Param("id") id: string) {
    const tenantId = this.tenantId(req);
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException("Webhook subscription not found");
    return sub;
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar suscripcion de webhook" })
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateWebhookDto
  ) {
    const tenantId = this.tenantId(req);
    const existing = await this.prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException("Webhook subscription not found");

    return this.prisma.webhookSubscription.update({
      where: { id },
      data: {
        ...(dto.url !== undefined && { url: dto.url }),
        ...(dto.events !== undefined && { events: dto.events }),
        ...(dto.secret !== undefined && { secret: dto.secret }),
      },
    });
  }

  @Delete(":id")
  @ApiOperation({ summary: "Eliminar suscripcion de webhook" })
  async remove(@Req() req: Request, @Param("id") id: string) {
    const tenantId = this.tenantId(req);
    const existing = await this.prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!existing)
      throw new NotFoundException("Webhook subscription not found");

    await this.prisma.webhookSubscription.delete({ where: { id } });
    return { deleted: true };
  }

  @Post(":id/test")
  @ApiOperation({ summary: "Enviar payload de prueba al webhook" })
  async test(@Req() req: Request, @Param("id") id: string) {
    const tenantId = this.tenantId(req);
    const sub = await this.prisma.webhookSubscription.findFirst({
      where: { id, tenantId },
    });
    if (!sub) throw new NotFoundException("Webhook subscription not found");

    const testPayload = {
      event: "webhook.test",
      tenantId,
      timestamp: new Date().toISOString(),
      message: "This is a test payload from SysPaq",
    };

    const result = await this.webhookChannel.send(
      sub.url,
      sub.secret,
      "webhook.test",
      testPayload
    );

    return {
      delivered: result.success,
      statusCode: result.statusCode,
      error: result.error,
    };
  }
}
