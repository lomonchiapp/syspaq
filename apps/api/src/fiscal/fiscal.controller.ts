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
import { ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { FiscalService } from "./fiscal.service";
import { CreateSequenceDto } from "./dto/create-sequence.dto";
import { UpdateSequenceDto } from "./dto/update-sequence.dto";
import { ReportQueryDto } from "./dto/report-query.dto";

@ApiTags("fiscal")
@Controller("fiscal")
export class FiscalController {
  constructor(private readonly fiscal: FiscalService) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  /* ---- Sequences ---- */

  @Post("sequences")
  createSequence(@Req() req: Request, @Body() dto: CreateSequenceDto) {
    return this.fiscal.createSequence(this.tenantId(req), dto);
  }

  @Get("sequences")
  listSequences(@Req() req: Request) {
    return this.fiscal.listSequences(this.tenantId(req));
  }

  @Get("sequences/:id")
  getSequence(@Req() req: Request, @Param("id") id: string) {
    return this.fiscal.getSequence(this.tenantId(req), id);
  }

  @Patch("sequences/:id")
  updateSequence(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateSequenceDto,
  ) {
    return this.fiscal.updateSequence(this.tenantId(req), id, dto);
  }

  /* ---- NCF Assignment ---- */

  @Post("invoices/:invoiceId/assign-ncf")
  assignNcf(@Req() req: Request, @Param("invoiceId") invoiceId: string) {
    return this.fiscal.assignNcf(this.tenantId(req), invoiceId);
  }

  /* ---- Reports ---- */

  @Get("reports/606")
  generate606(@Req() req: Request, @Query() query: ReportQueryDto) {
    return this.fiscal.generate606(this.tenantId(req), query.period);
  }

  @Get("reports/607")
  generate607(@Req() req: Request, @Query() query: ReportQueryDto) {
    return this.fiscal.generate607(this.tenantId(req), query.period);
  }

  @Get("reports/aging")
  getAging(@Req() req: Request) {
    return this.fiscal.getAging(this.tenantId(req));
  }

  /* ---- Summary ---- */

  @Get("summary")
  getSummary(@Req() req: Request, @Query() query: ReportQueryDto) {
    return this.fiscal.getSummary(this.tenantId(req), query.period);
  }
}
