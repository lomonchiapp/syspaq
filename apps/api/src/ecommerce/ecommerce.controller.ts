import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
} from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiTags } from "@nestjs/swagger";
import { ActorType } from "@prisma/client";
import { Request } from "express";
import { AuditService } from "@/common/audit/audit.service";
import { EcommerceService } from "./ecommerce.service";
import { CreateConnectionDto } from "./dto/create-connection.dto";
import { UpdateConnectionDto } from "./dto/update-connection.dto";

@ApiTags("ecommerce")
@ApiHeader({ name: "X-Tenant-Id", required: true })
@ApiHeader({ name: "X-Api-Key", required: false })
@Controller("ecommerce/connections")
export class EcommerceController {
  constructor(
    private readonly ecommerce: EcommerceService,
    private readonly audit: AuditService,
  ) {}

  private tenantId(req: Request): string {
    return req.auth!.tenantId;
  }

  @Post()
  @ApiOperation({ summary: "Create an e-commerce connection" })
  async create(@Req() req: Request, @Body() dto: CreateConnectionDto) {
    const result = await this.ecommerce.createConnection(
      this.tenantId(req),
      dto,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "CREATE",
      resource: "EcommerceConnection",
      resourceId: result.id,
      meta: { platform: dto.platform, shopDomain: dto.shopDomain },
    });
    return result;
  }

  @Get()
  @ApiOperation({ summary: "List e-commerce connections" })
  list(@Req() req: Request) {
    return this.ecommerce.listConnections(this.tenantId(req));
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update an e-commerce connection" })
  async update(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: UpdateConnectionDto,
  ) {
    const result = await this.ecommerce.updateConnection(
      this.tenantId(req),
      id,
      dto,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "UPDATE",
      resource: "EcommerceConnection",
      resourceId: id,
    });
    return result;
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete an e-commerce connection" })
  async delete(@Req() req: Request, @Param("id") id: string) {
    const result = await this.ecommerce.deleteConnection(
      this.tenantId(req),
      id,
    );
    this.audit.log({
      tenantId: this.tenantId(req),
      actor: (req.auth!.apiKeyId || req.auth!.userId || "unknown") ?? "system",
      actorType: ActorType.API_KEY,
      action: "DELETE",
      resource: "EcommerceConnection",
      resourceId: id,
    });
    return result;
  }
}
