import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { ApiRole } from "@prisma/client";
import { Request } from "express";
import { AuthService } from "@/auth/auth.service";
import { IS_PUBLIC_KEY } from "@/common/decorators/public.decorator";

export type AuthContext = {
  apiKeyId?: string;
  userId?: string;
  tenantId: string;
  role: ApiRole;
  via: "jwt" | "apiKey" | "user-jwt";
};

@Injectable()
export class CombinedAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly auth: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      try {
        const payload = await this.jwt.verifyAsync<{
          sub: string;
          tenantId: string;
          role: ApiRole;
          type?: string;
        }>(token);

        if (payload.type === "user") {
          req.auth = {
            userId: payload.sub,
            tenantId: payload.tenantId,
            role: payload.role,
            via: "user-jwt",
          };
        } else {
          req.auth = {
            apiKeyId: payload.sub,
            tenantId: payload.tenantId,
            role: payload.role,
            via: "jwt",
          };
        }
        return true;
      } catch {
        throw new UnauthorizedException("Invalid or expired token");
      }
    }

    const rawKey = req.headers["x-api-key"];
    const tenantId = req.headers["x-tenant-id"];
    if (typeof rawKey !== "string" || typeof tenantId !== "string") {
      throw new UnauthorizedException("Missing X-Api-Key or X-Tenant-Id");
    }

    const key = await this.auth.validateApiKey(rawKey, tenantId);
    req.auth = {
      apiKeyId: key.id,
      tenantId: key.tenantId,
      role: key.role,
      via: "apiKey",
    };
    return true;
  }
}
