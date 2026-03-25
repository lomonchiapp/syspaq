import { Body, Controller, Delete, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { ApiRole } from "@prisma/client";
import { IsOptional, IsEnum, IsString, MinLength } from "class-validator";
import { Request } from "express";
import { SettingsService } from "./settings.service";

class CreateApiKeyDto {
  @IsString()
  @MinLength(1)
  name!: string;

  @IsOptional()
  @IsEnum(ApiRole)
  role?: ApiRole;
}

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

  @Post("api-keys")
  @ApiOperation({ summary: "Create a new API key (raw key returned once)" })
  async createApiKey(@Req() req: Request, @Body() dto: CreateApiKeyDto) {
    return this.settings.createApiKey(req.auth!.tenantId, dto.name, dto.role);
  }

  @Delete("api-keys/:id")
  @ApiOperation({ summary: "Revoke an API key" })
  async revokeApiKey(@Req() req: Request, @Param("id") id: string) {
    await this.settings.revokeApiKey(req.auth!.tenantId, id);
    return { success: true };
  }
}
