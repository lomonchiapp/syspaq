import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { RoutesService } from "./routes.service";
import { CreateRouteDto } from "./dto/create-route.dto";
import { ListQueryDto } from "./dto/list-query.dto";

@ApiTags("fleet")
@Controller("fleet/routes")
export class RoutesController {
  constructor(private readonly routes: RoutesService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  private actorId(req: Request): string {
    return req.auth!.userId ?? req.auth!.apiKeyId!;
  }

  @Post()
  @ApiOperation({ summary: "Crear ruta de entrega" })
  create(@Req() req: Request, @Body() dto: CreateRouteDto) {
    return this.routes.create(this.tenantId(req), dto, this.actorId(req));
  }

  @Get()
  @ApiOperation({ summary: "Listar rutas (paginado)" })
  list(@Req() req: Request, @Query() query: ListQueryDto) {
    return this.routes.list(this.tenantId(req), query);
  }

  @Get("dashboard")
  @ApiOperation({ summary: "Dashboard de flota" })
  getDashboard(@Req() req: Request) {
    return this.routes.getDashboard(this.tenantId(req));
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de ruta" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.routes.findOne(this.tenantId(req), id);
  }

  @Post(":id/start")
  @ApiOperation({ summary: "Iniciar ruta" })
  start(@Req() req: Request, @Param("id") id: string) {
    return this.routes.start(this.tenantId(req), id);
  }

  @Post(":id/stops/:stopId/arrive")
  @ApiOperation({ summary: "Marcar llegada a parada" })
  arriveAtStop(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("stopId") stopId: string,
  ) {
    return this.routes.arriveAtStop(this.tenantId(req), id, stopId);
  }

  @Post(":id/stops/:stopId/complete")
  @ApiOperation({ summary: "Completar parada" })
  completeStop(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("stopId") stopId: string,
  ) {
    return this.routes.completeStop(this.tenantId(req), id, stopId);
  }

  @Post(":id/stops/:stopId/skip")
  @ApiOperation({ summary: "Saltar parada" })
  skipStop(
    @Req() req: Request,
    @Param("id") id: string,
    @Param("stopId") stopId: string,
    @Body("notes") notes?: string,
  ) {
    return this.routes.skipStop(this.tenantId(req), id, stopId, notes);
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Completar ruta" })
  complete(@Req() req: Request, @Param("id") id: string) {
    return this.routes.complete(this.tenantId(req), id);
  }

  @Post(":id/cancel")
  @ApiOperation({ summary: "Cancelar ruta" })
  cancel(@Req() req: Request, @Param("id") id: string) {
    return this.routes.cancel(this.tenantId(req), id);
  }
}
