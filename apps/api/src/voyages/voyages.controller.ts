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
import { VoyagesService } from "./voyages.service";
import { CreateVoyageDto } from "./dto/create-voyage.dto";
import { UpdateVoyageDto } from "./dto/update-voyage.dto";
import { ListVoyagesQueryDto } from "./dto/list-voyages-query.dto";
import { TransitionVoyageStatusDto } from "./dto/transition-voyage-status.dto";
import { LinkContainerDto } from "./dto/link-container.dto";

@ApiTags("voyages")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("voyages")
export class VoyagesController {
  constructor(
    private readonly voyages: VoyagesService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Crear embarcacion" })
  async create(@Req() req: Request, @Body() dto: CreateVoyageDto) {
    const voyage = await this.voyages.create(this.tenantId(req), dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "voyage.create",
      resource: "voyage",
      resourceId: voyage.id,
    });
    return voyage;
  }

  @Get()
  @ApiOperation({ summary: "Listar embarcaciones (paginado)" })
  list(@Req() req: Request, @Query() query: ListVoyagesQueryDto) {
    return this.voyages.list(this.tenantId(req), query.page, query.limit, {
      status: query.status,
      mode: query.mode,
      carrier: query.carrier,
    });
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de embarcacion con contenedores" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.voyages.findOne(this.tenantId(req), id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar embarcacion" })
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateVoyageDto,
  ) {
    const voyage = await this.voyages.update(this.tenantId(req), id, dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "voyage.update",
      resource: "voyage",
      resourceId: voyage.id,
    });
    return voyage;
  }

  @Post(":id/transition")
  @ApiOperation({ summary: "Transicionar estado de embarcacion" })
  async transitionStatus(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: TransitionVoyageStatusDto,
  ) {
    const voyage = await this.voyages.transitionStatus(
      this.tenantId(req),
      id,
      dto.status,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "voyage.transition",
      resource: "voyage",
      resourceId: id,
      meta: { newStatus: dto.status },
    });
    return voyage;
  }

  @Post(":id/containers")
  @ApiOperation({ summary: "Vincular contenedor a embarcacion" })
  async linkContainer(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: LinkContainerDto,
  ) {
    const container = await this.voyages.linkContainer(
      this.tenantId(req),
      id,
      dto.containerId,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "voyage.linkContainer",
      resource: "voyage",
      resourceId: id,
      meta: { containerId: dto.containerId },
    });
    return container;
  }

  @Delete(":id/containers/:containerId")
  @ApiOperation({ summary: "Desvincular contenedor de embarcacion" })
  async unlinkContainer(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("containerId") containerId: string,
  ) {
    const result = await this.voyages.unlinkContainer(
      this.tenantId(req),
      id,
      containerId,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "voyage.unlinkContainer",
      resource: "voyage",
      resourceId: id,
      meta: { containerId },
    });
    return result;
  }
}
