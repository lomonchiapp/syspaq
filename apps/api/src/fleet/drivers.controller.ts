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
import { DriversService } from "./drivers.service";
import { CreateDriverDto } from "./dto/create-driver.dto";
import { UpdateDriverDto } from "./dto/update-driver.dto";
import { ListQueryDto } from "./dto/list-query.dto";

@ApiTags("fleet")
@Controller("fleet/drivers")
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Crear conductor" })
  create(@Req() req: Request, @Body() dto: CreateDriverDto) {
    return this.drivers.create(this.tenantId(req), dto);
  }

  @Get()
  @ApiOperation({ summary: "Listar conductores (paginado)" })
  list(@Req() req: Request, @Query() query: ListQueryDto) {
    return this.drivers.list(this.tenantId(req), query);
  }

  @Get("active-locations")
  @ApiOperation({ summary: "Ubicaciones activas de conductores" })
  getActiveLocations(@Req() req: Request) {
    return this.drivers.getActiveLocations(this.tenantId(req));
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de conductor" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.drivers.findOne(this.tenantId(req), id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Actualizar conductor" })
  update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.drivers.update(this.tenantId(req), id, dto);
  }
}
