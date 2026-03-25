import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { ApiRole } from "@prisma/client";
import { randomBytes } from "crypto";
import { PrismaService } from "@/prisma/prisma.service";
import { hashApiKey } from "@/common/crypto/api-key-hash";

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

  async createApiKey(tenantId: string, name: string, role: ApiRole = ApiRole.INTEGRATION) {
    const pepper = this.config.get<string>("apiKeyPepper") ?? "";
    const rawKey = `spq_live_${randomBytes(24).toString("base64url")}`;
    const keyHash = hashApiKey(rawKey, pepper);
    const keyPrefix = rawKey.slice(0, 16);

    const key = await this.prisma.apiKey.create({
      data: { tenantId, name, keyHash, keyPrefix, role },
    });

    return {
      id: key.id,
      prefix: key.keyPrefix,
      name: key.name,
      role: key.role,
      createdAt: key.createdAt.toISOString(),
      // Returned only once — never stored in plaintext
      rawKey,
    };
  }

  async revokeApiKey(tenantId: string, keyId: string) {
    const key = await this.prisma.apiKey.findFirst({ where: { id: keyId, tenantId } });
    if (!key) throw new NotFoundException("API key not found");
    await this.prisma.apiKey.delete({ where: { id: keyId } });
  }
}
