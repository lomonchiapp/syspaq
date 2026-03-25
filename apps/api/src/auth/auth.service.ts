import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { ApiKey, ApiRole } from "@prisma/client";
import { randomBytes } from "crypto";
import * as bcrypt from "bcryptjs";
import { PrismaService } from "@/prisma/prisma.service";
import { UsersService } from "@/users/users.service";
import { hashApiKey, safeEqualHex } from "@/common/crypto/api-key-hash";
import { SignupDto } from "./dto/signup.dto";

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly jwt: JwtService,
    private readonly users: UsersService,
  ) {}

  async signup(dto: SignupDto) {
    const pepper = this.config.get<string>("apiKeyPepper") ?? "";

    // Check slug uniqueness
    const existing = await this.prisma.tenant.findUnique({ where: { slug: dto.slug } });
    if (existing) throw new ConflictException("El slug ya está en uso");

    const rawKey = `spq_live_${randomBytes(24).toString("base64url")}`;
    const keyHash = hashApiKey(rawKey, pepper);
    const keyPrefix = rawKey.slice(0, 16);

    const tenant = await this.prisma.$transaction(async (tx) => {
      const t = await tx.tenant.create({
        data: {
          slug: dto.slug,
          name: dto.companyName,
          casilleroPrefix: dto.slug.slice(0, 3).toUpperCase(),
        },
      });

      await tx.apiKey.create({
        data: {
          tenantId: t.id,
          name: "Default API Key",
          keyHash,
          keyPrefix,
          role: ApiRole.ADMIN,
        },
      });

      const passwordHash = await bcrypt.hash(dto.password, 12);
      await tx.user.create({
        data: {
          tenantId: t.id,
          email: dto.email.toLowerCase().trim(),
          passwordHash,
          firstName: dto.firstName,
          lastName: dto.lastName,
          role: ApiRole.ADMIN,
        },
      });

      return t;
    });

    const accessToken = this.issueAccessToken(tenant.id, tenant.id, ApiRole.ADMIN, "user");

    return {
      access_token: accessToken,
      token_type: "Bearer" as const,
      expires_in: 86400,
      tenant: {
        id: tenant.id,
        slug: tenant.slug,
        name: tenant.name,
      },
      api_key: rawKey,
    };
  }

  async validateApiKey(rawKey: string, tenantId: string): Promise<ApiKey> {
    const pepper = this.config.get<string>("apiKeyPepper") ?? "";
    const digest = hashApiKey(rawKey, pepper);

    const candidates = await this.prisma.apiKey.findMany({
      where: { tenantId },
    });

    const match = candidates.find((c) => safeEqualHex(c.keyHash, digest));
    if (!match) {
      throw new UnauthorizedException("Invalid API key");
    }

    await this.prisma.apiKey.update({
      where: { id: match.id },
      data: { lastUsedAt: new Date() },
    });

    return match;
  }

  issueAccessToken(sub: string, tenantId: string, role: ApiRole, type: "apiKey" | "user" = "apiKey"): string {
    return this.jwt.sign({
      sub,
      tenantId,
      role,
      type,
    });
  }

  /**
   * Accepts a tenant UUID or slug and returns the UUID.
   */
  async resolveTenantId(tenantIdOrSlug: string): Promise<string> {
    // If it looks like a UUID, try direct lookup first
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(tenantIdOrSlug)) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantIdOrSlug },
        select: { id: true },
      });
      if (tenant) return tenant.id;
    }

    // Try slug lookup
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: tenantIdOrSlug },
      select: { id: true },
    });
    if (!tenant) {
      throw new UnauthorizedException("Tenant not found");
    }
    return tenant.id;
  }

  /**
   * Full login flow for dashboard users.
   */
  async loginUser(tenantIdOrSlug: string, email: string, password: string) {
    const tenantId = await this.resolveTenantId(tenantIdOrSlug);

    const user = await this.users.findByEmail(tenantId, email);
    if (!user) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await this.users.validatePassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const accessToken = this.issueAccessToken(user.id, tenantId, user.role, "user");

    // Fire-and-forget lastLogin update
    this.users.updateLastLogin(user.id).catch(() => {});

    return {
      access_token: accessToken,
      token_type: "Bearer" as const,
      expires_in: 86400,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }
}
