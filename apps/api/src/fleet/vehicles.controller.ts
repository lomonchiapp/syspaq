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
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { VehiclesService } from "./vehicles.service";
import { CreateVehicleDto } from "./dto/create-vehicle.dto";
import { UpdateVehicleDto } from "./dto/update-vehicle.dto";
import { ListQueryDto } from "./dto/list-query.dto";

@ApiTags("fleet")
@Controller("fleet/vehicles")
export class VehiclesController {
  constructor(private readonly vehicles: VehiclesService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Crear vehículo" })
  create(@Req() req: Request, @Body() dto: CreateVehicleDto) {
    return this.vehicles.create(this.tenantId(req), dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar vehículos (paginado)" })
  list(@Req() req: Request, @Query() query: ListQueryDto) {
    return this.vehicles.list(this.tenantId(req), query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de vehículo" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.vehicles.findOne(this.tenantId(req), id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar vehículo" })
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicles.update(this.tenantId(req), id, dto);
  }
}
