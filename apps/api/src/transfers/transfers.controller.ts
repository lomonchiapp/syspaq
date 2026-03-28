import {
  Body,
  Controller,
  Delete,
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
import { TransfersService } from "./transfers.service";
import { CreateTransferDto } from "./dto/create-transfer.dto";
import { AddTransferItemDto } from "./dto/add-transfer-item.dto";
import { ListTransfersQueryDto } from "./dto/list-transfers-query.dto";

@ApiTags("transfers")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("transfers")
export class TransfersController {
  constructor(
    private readonly transfers: TransfersService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Crear transferencia entre sucursales" })
  async create(@Req() req: Request, @Body() dto: CreateTransferDto) {
    const transfer = await this.transfers.create(this.tenantId(req), dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "transfer.create",
      resource: "transfer",
      resourceId: transfer.id,
    });
    return transfer;
  }

  @Get()
  @ApiOperation({ summary: "Listar transferencias (paginado)" })
  list(@Req() req: Request, @Query() query: ListTransfersQueryDto) {
    return this.transfers.list(this.tenantId(req), query.page, query.limit, {
      status: query.status,
      type: query.type,
      branchId: query.branchId,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de transferencia con items" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.transfers.findOne(this.tenantId(req), id);
  }

  @Post(":id/items")
  @ApiOperation({ summary: "Agregar envio a transferencia" })
  async addItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AddTransferItemDto,
  ) {
    const item = await this.transfers.addItem(this.tenantId(req), id, dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "transfer.addItem",
      resource: "transfer",
      resourceId: id,
      meta: { shipmentId: dto.shipmentId },
    });
    return item;
  }

  @Delete(":id/items/:shipmentId")
  @ApiOperation({ summary: "Remover envio de transferencia" })
  async removeItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("shipmentId") shipmentId: string,
  ) {
    const result = await this.transfers.removeItem(
      this.tenantId(req),
      id,
      shipmentId,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "transfer.removeItem",
      resource: "transfer",
      resourceId: id,
      meta: { shipmentId },
    });
    return result;
  }

  @Post(":id/dispatch")
  @ApiOperation({ summary: "Despachar transferencia (crea contraparte entrante)" })
  async dispatch(@Req() req: Request, @Param("id") id: string) {
    const result = await this.transfers.dispatch(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "transfer.dispatch",
      resource: "transfer",
      resourceId: id,
    });
    return result;
  }

  @Post(":id/receive")
  @ApiOperation({ summary: "Recibir transferencia en destino" })
  async receive(@Req() req: Request, @Param("id") id: string) {
    const result = await this.transfers.receive(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "transfer.receive",
      resource: "transfer",
      resourceId: id,
    });
    return result;
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancelar transferencia" })
  async cancel(@Req() req: Request, @Param("id") id: string) {
    const result = await this.transfers.cancel(this.tenantId(req), id);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "transfer.cancel",
      resource: "transfer",
      resourceId: id,
    });
    return result;
  }
}
