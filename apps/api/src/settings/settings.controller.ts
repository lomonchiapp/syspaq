import { Body, Controller, Get, Patch, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settings: SettingsService) {}

  @Get("tenant")
  @ApiOperation({ summary: "Get tenant settings" })
  async getTenant(@Req() req: Request) {
    return this.settings.getTenantSettings(req.auth!.tenantId);
  }

  @Patch("tenant")
  @ApiOperation({ summary: "Update tenant settings" })
  async updateTenant(
    @Req() req: Request,
    @Body() data: { tenantName?: string; casilleroPrefix?: string },
  ) {
    return this.settings.updateTenantSettings(req.auth!.tenantId, data);
  }

  @Get("api-keys")
  @ApiOperation({ summary: "List API keys for tenant" })
  async getApiKeys(@Req() req: Request) {
    return this.settings.getApiKeys(req.auth!.tenantId);
  }
}
