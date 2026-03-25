import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { BulkImportService } from "./bulk-import.service";
import { BulkImportCustomersDto } from "./dto/bulk-import-customers.dto";
import { BulkImportShipmentsDto } from "./dto/bulk-import-shipments.dto";
import { BulkImportPreAlertsDto } from "./dto/bulk-import-pre-alerts.dto";

@ApiTags("bulk-import")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("bulk-import")
export class BulkImportController {
  constructor(private readonly bulkImport: BulkImportService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  private createdBy(req: Request): string {
    return (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "unknown";
  }

  @Post("customers")
  @ApiOperation({ summary: "Importar clientes en lote" })
  importCustomers(@Req() req: Request, @Body() dto: BulkImportCustomersDto) {
    return this.bulkImport.importCustomers(
      this.tenantId(req),
      this.createdBy(req),
      dto.items,
    );
  }

  @Post("shipments")
  @ApiOperation({ summary: "Importar envíos en lote" })
  importShipments(@Req() req: Request, @Body() dto: BulkImportShipmentsDto) {
    return this.bulkImport.importShipments(
      this.tenantId(req),
      this.createdBy(req),
      dto.items,
    );
  }

  @Post("pre-alerts")
  @ApiOperation({ summary: "Importar pre-alertas en lote" })
  importPreAlerts(@Req() req: Request, @Body() dto: BulkImportPreAlertsDto) {
    return this.bulkImport.importPreAlerts(
      this.tenantId(req),
      this.createdBy(req),
      dto.items,
    );
  }

  @Get()
  @ApiOperation({ summary: "Listar importaciones (paginado)" })
  list(
    @Req() req: Request,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    return this.bulkImport.list(
      this.tenantId(req),
      page ? Number(page) : 1,
      limit ? Number(limit) : 20,
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Detalle de importación con errores" })
  findOne(@Req() req: Request, @Param("id") id: string) {
    return this.bulkImport.findOne(this.tenantId(req), id);
  }
}
