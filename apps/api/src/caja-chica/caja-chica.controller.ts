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
import { CajaChicaService } from "./caja-chica.service";
import { OpenSessionDto } from "./dto/open-session.dto";
import { CloseSessionDto } from "./dto/close-session.dto";
import { ReconcileSessionDto } from "./dto/reconcile-session.dto";
import { CreateTransactionDto } from "./dto/create-transaction.dto";
import { ListSessionsQueryDto } from "./dto/list-sessions-query.dto";
import { ListTransactionsQueryDto } from "./dto/list-transactions-query.dto";

@ApiTags("caja-chica")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false, description: "Si no usas Bearer JWT" })
@Controller("caja-chica")
export class CajaChicaController {
  constructor(private readonly cajaChica: CajaChicaService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  private actorId(req: Request): string {
    return req.auth!.userId || req.auth!.apiKeyId || "unknown";
  }

  @Post("sessions")
  @ApiOperation({ summary: "Abrir sesión de caja chica" })
  openSession(@Req() req: Request, @Body() dto: OpenSessionDto) {
    return this.cajaChica.openSession(this.tenantId(req), dto, this.actorId(req));
  }

  @Get("sessions")
  @ApiOperation({ summary: "Listar sesiones de caja chica (paginado)" })
  listSessions(@Req() req: Request, @Query() query: ListSessionsQueryDto) {
    return this.cajaChica.listSessions(this.tenantId(req), query);
  }

  @Get("sessions/:id")
  @ApiOperation({ summary: "Detalle de sesión de caja chica" })
  getSession(@Req() req: Request, @Param("id") id: string) {
    return this.cajaChica.getSession(this.tenantId(req), id);
  }

  @Post("sessions/:id/close")
  @ApiOperation({ summary: "Cerrar sesión de caja chica" })
  closeSession(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CloseSessionDto,
  ) {
    return this.cajaChica.closeSession(
      this.tenantId(req),
      id,
      dto,
      this.actorId(req),
    );
  }

  @Post("sessions/:id/reconcile")
  @ApiOperation({ summary: "Reconciliar sesión de caja chica" })
  reconcileSession(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: ReconcileSessionDto,
  ) {
    return this.cajaChica.reconcileSession(this.tenantId(req), id, dto);
  }

  @Post("transactions")
  @ApiOperation({ summary: "Crear transacción manual de caja chica" })
  createTransaction(@Req() req: Request, @Body() dto: CreateTransactionDto) {
    return this.cajaChica.createTransaction(
      this.tenantId(req),
      dto,
      this.actorId(req),
    );
  }

  @Get("transactions")
  @ApiOperation({ summary: "Listar transacciones de caja chica (paginado)" })
  listTransactions(
    @Req() req: Request,
    @Query() query: ListTransactionsQueryDto,
  ) {
    return this.cajaChica.listTransactions(this.tenantId(req), query);
  }

  @Get("summary")
  @ApiOperation({ summary: "Resumen de caja chica por sucursal" })
  getSummary(@Req() req: Request) {
    return this.cajaChica.getSummary(this.tenantId(req));
  }
}
