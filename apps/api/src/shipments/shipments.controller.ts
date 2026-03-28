import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { ShipmentsService } from "./shipments.service";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { UpdateShipmentDto } from "./dto/update-shipment.dto";
import { AddEventDto } from "./dto/add-event.dto";
import { ListShipmentsQueryDto } from "./dto/list-shipments-query.dto";
import { ListEventsQueryDto } from "./dto/list-events-query.dto";

@ApiTags("shipments")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("shipments")
export class ShipmentsController {
  constructor(private readonly shipments: ShipmentsService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Crear envío y evento CREATED inicial" })
  create(@Req() req: Request, @Body() dto: CreateShipmentDto) {
    return this.shipments.create(this.tenantId(req), dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar envíos (paginado)" })
  list(@Req() req: Request, @Query() query: ListShipmentsQueryDto) {
    return this.shipments.list(
      this.tenantId(req),
      query.page,
      query.limit,
      query.search,
      query.phase,
      query.customerId,
      query.destBranchId,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de envío" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.shipments.findOne(this.tenantId(req), id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar datos del envío" })
  update(@Req() req: Request, @Param("id") id: string, @Body() dto: UpdateShipmentDto) {
    return this.shipments.update(this.tenantId(req), id, dto);
  }

  @Get(":id/events")
  @ApiOperation({ summary: "Timeline de eventos" })
  listEvents(
    @Req() req: Request,
    @Param("id") id: string,
    @Query() query: ListEventsQueryDto
  ) {
    return this.shipments.listEvents(
      this.tenantId(req),
      id,
      query.page,
      query.limit
    );
  }

  @Post(":id/events")
  @ApiOperation({ summary: "Añadir evento de tracking (append-only)" })
  @ApiHeader({ name: "Idempotency-Key", required: false })
  addEvent(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: AddEventDto,
    @Headers("idempotency-key") idempotencyKey?: string
  ) {
    return this.shipments.addEvent(this.tenantId(req), id, dto, idempotencyKey);
  }
}
