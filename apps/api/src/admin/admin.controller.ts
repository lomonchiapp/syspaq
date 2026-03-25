import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SuperAdminGuard } from "@/common/guards/super-admin.guard";
import { AdminService } from "./admin.service";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";

@ApiTags("admin")
@UseGuards(SuperAdminGuard)
@Controller("admin")
export class AdminController {
  constructor(private readonly admin: AdminService) {}

  @Get("stats")
  @ApiOperation({ summary: "Platform stats (superadmin)" })
  getStats() {
    return this.admin.getStats();
  }

  @Get("renewals")
  @ApiOperation({ summary: "Upcoming renewals within N days" })
  getUpcomingRenewals(@Query("days") days?: string) {
    return this.admin.getUpcomingRenewals(days ? parseInt(days, 10) : 30);
  }

  @Get("tenants")
  @ApiOperation({ summary: "List all tenants" })
  getTenants() {
    return this.admin.getTenants();
  }

  @Get("tenants/:id")
  @ApiOperation({ summary: "Get tenant detail" })
  getTenant(@Param("id") id: string) {
    return this.admin.getTenantById(id);
  }

  @Patch("tenants/:id")
  @ApiOperation({ summary: "Update tenant plan/status/notes" })
  updateTenant(@Param("id") id: string, @Body() dto: UpdateTenantDto) {
    return this.admin.updateTenant(id, dto);
  }

  @Post("tenants/:id/payments")
  @ApiOperation({ summary: "Record a manual payment" })
  recordPayment(
    @Param("id") id: string,
    @Body() dto: RecordPaymentDto,
    @Req() req: Request,
  ) {
    const recordedBy = req.auth?.userId ?? req.auth?.apiKeyId ?? "system";
    return this.admin.recordPayment(id, dto, recordedBy);
  }

  @Get("tenants/:id/payments")
  @ApiOperation({ summary: "Get billing history for a tenant" })
  getPayments(@Param("id") id: string) {
    return this.admin.getPayments(id);
  }
}
