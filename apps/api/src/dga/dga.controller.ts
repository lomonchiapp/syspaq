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
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ActorType } from "@prisma/client";
import { Request } from "express";
import { AuditService } from "@/common/audit/audit.service";
import { DgaService } from "./dga.service";
import { CreateDgaLabelDto } from "./dto/create-dga-label.dto";
import { UpdateDgaLabelDto } from "./dto/update-dga-label.dto";
import { ListDgaLabelsQueryDto } from "./dto/list-dga-labels-query.dto";
import { GenerateForContainerDto } from "./dto/generate-for-container.dto";
import { BulkUpdateStatusDto } from "./dto/bulk-update-status.dto";

@ApiTags("dga")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("dga")
export class DgaController {
  constructor(
    private readonly dga: DgaService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post("labels")
  @ApiOperation({ summary: "Crear etiqueta DGA" })
  async create(@Req() req: Request, @Body() dto: CreateDgaLabelDto) {
    const label = await this.dga.create(this.tenantId(req), dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "dga.create",
      resource: "dgaLabel",
      resourceId: label.id,
    });
    return label;
  }

  @Get("labels")
  @ApiOperation({ summary: "Listar etiquetas DGA (paginado)" })
  list(@Req() req: Request, @Query() query: ListDgaLabelsQueryDto) {
    return this.dga.list(this.tenantId(req), query.page, query.limit, {
      status: query.status,
      containerId: query.containerId,
      shipmentId: query.shipmentId,
    });
  }

  @Get("labels/:id")
  @ApiOperation({ summary: "Detalle de etiqueta DGA" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.dga.findOne(this.tenantId(req), id);
  }

  @Patch("labels/:id")
  @ApiOperation({ summary: "Actualizar etiqueta DGA" })
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateDgaLabelDto,
  ) {
    const label = await this.dga.update(this.tenantId(req), id, dto);
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "dga.update",
      resource: "dgaLabel",
      resourceId: label.id,
    });
    return label;
  }

  @Post("labels/generate-for-container")
  @ApiOperation({ summary: "Auto-generar etiquetas DGA para un contenedor" })
  async generateForContainer(
    @Req() req: Request,
    @Body() dto: GenerateForContainerDto,
  ) {
    const result = await this.dga.generateForContainer(
      this.tenantId(req),
      dto.containerId,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "dga.generateForContainer",
      resource: "container",
      resourceId: dto.containerId,
      meta: { generated: result.generated },
    });
    return result;
  }

  @Post("labels/bulk-status")
  @ApiOperation({ summary: "Actualizar estado de multiples etiquetas DGA" })
  async bulkUpdateStatus(
    @Req() req: Request,
    @Body() dto: BulkUpdateStatusDto,
  ) {
    const result = await this.dga.bulkUpdateStatus(
      this.tenantId(req),
      dto.ids,
      dto.status,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown"),
      actorType: ActorType.API_KEY,
      action: "dga.bulkUpdateStatus",
      resource: "dgaLabel",
      meta: { ids: dto.ids, status: dto.status, updated: result.updated },
    });
    return result;
  }

  @Get("stats")
  @ApiOperation({ summary: "Estadisticas de etiquetas DGA" })
  getStats(
    @Req() req: Request,
    @Query("containerId") containerId?: string,
  ) {
    return this.dga.getStats(this.tenantId(req), containerId);
  }
}
