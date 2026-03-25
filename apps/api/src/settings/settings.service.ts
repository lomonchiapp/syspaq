import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getTenantSettings(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");

    return {
      tenantName: tenant.name,
      slug: tenant.slug,
      casilleroPrefix: tenant.casilleroPrefix,
      casilleroCounter: tenant.casilleroCounter,
      stripeConfigured: !!this.config.get<string>("stripe.secretKey"),
      paypalConfigured: !!this.config.get<string>("paypal.clientId"),
      smtpHost: this.config.get<string>("smtp.host") || undefined,
      smtpPort: this.config.get<number>("smtp.port") || undefined,
      smtpUser: this.config.get<string>("smtp.user") || undefined,
    };
  }

  async updateTenantSettings(
    tenantId: string,
    data: { tenantName?: string; casilleroPrefix?: string },
  ) {
    const update: Record<string, unknown> = {};
    if (data.tenantName) update.name = data.tenantName;
    if (data.casilleroPrefix) update.casilleroPrefix = data.casilleroPrefix;

    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: update,
    });

    return this.getTenantSettings(tenant.id);
  }

  async getApiKeys(tenantId: string) {
    const keys = await this.prisma.apiKey.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        keyPrefix: true,
        name: true,
        role: true,
        lastUsedAt: true,
        createdAt: true,
      },
    });

    return keys.map((k) => ({
      id: k.id,
      prefix: k.keyPrefix,
      name: k.name,
      role: k.role,
      lastUsedAt: k.lastUsedAt?.toISOString() ?? null,
      createdAt: k.createdAt.toISOString(),
    }));
  }
}
