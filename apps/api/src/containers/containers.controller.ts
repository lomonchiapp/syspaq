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
import { ContainersService } from "./containers.service";
import { CreateContainerDto } from "./dto/create-container.dto";
import { UpdateContainerDto } from "./dto/update-container.dto";
import { AddContainerItemDto } from "./dto/add-container-item.dto";
import { ListContainersQueryDto } from "./dto/list-containers-query.dto";
import { TransitionStatusDto } from "./dto/transition-status.dto";

@ApiTags("containers")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("containers")
export class ContainersController {
  constructor(
    private readonly containers: ContainersService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Crear contenedor" })
  async create(@Req() req: Request, @Body() dto: CreateContainerDto) {
    const container = await this.containers.create(this.tenantId(req), dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "container.create",
      resource: "container",
      resourceId: container.id,
    });
    return container;
  }

  @Get()
  @ApiOperation({ summary: "Listar contenedores (paginado)" })
  list(@Req() req: Request, @Query() query: ListContainersQueryDto) {
    return this.containers.list(this.tenantId(req), query.page, query.limit, {
      status: query.status,
      mode: query.mode,
      origin: query.origin,
      destination: query.destination,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de contenedor con items" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.containers.findOne(this.tenantId(req), id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar contenedor" })
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateContainerDto,
  ) {
    const container = await this.containers.update(this.tenantId(req), id, dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "container.update",
      resource: "container",
      resourceId: container.id,
    });
    return container;
  }

  @Post(":id/items")
  @ApiOperation({ summary: "Agregar envio a contenedor" })
  async addItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AddContainerItemDto,
  ) {
    const item = await this.containers.addItem(this.tenantId(req), id, dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "container.addItem",
      resource: "container",
      resourceId: id,
      meta: { shipmentId: dto.shipmentId },
    });
    return item;
  }

  @Delete(":id/items/:shipmentId")
  @ApiOperation({ summary: "Remover envio de contenedor" })
  async removeItem(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("shipmentId") shipmentId: string,
  ) {
    const result = await this.containers.removeItem(
      this.tenantId(req),
      id,
      shipmentId,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "container.removeItem",
      resource: "container",
      resourceId: id,
      meta: { shipmentId },
    });
    return result;
  }

  @Post(":id/transition")
  @ApiOperation({ summary: "Transicionar estado del contenedor" })
  async transitionStatus(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: TransitionStatusDto,
  ) {
    const container = await this.containers.transitionStatus(
      this.tenantId(req),
      id,
      dto.status,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "container.transition",
      resource: "container",
      resourceId: id,
      meta: { newStatus: dto.status },
    });
    return container;
  }

  @Get(":id/manifest")
  @ApiOperation({ summary: "Manifiesto completo para DGA" })
  getManifest(@Req() req: Request, @Param("id") id: string) {
    return this.containers.getManifest(this.tenantId(req), id);
  }
}
