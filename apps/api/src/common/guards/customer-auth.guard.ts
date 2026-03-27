import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Request } from "express";
import * as jwt from "jsonwebtoken";

@Injectable()
export class CustomerAuthGuard implements CanActivate {
  constructor(
    private readonly config: ConfigService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // NOTE: Do NOT check IS_PUBLIC_KEY here. @Public() is used on customer
    // controllers to bypass the global CombinedAuthGuard, but this guard
    // must still validate the customer JWT and populate req.customerAuth.

    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing customer Bearer token");
    }

    const token = authHeader.slice(7);
    try {
      const secret = this.config.get<string>("customerJwtSecret");
      const payload = jwt.verify(token, secret!) as {
        sub: string;
        tenantId: string;
        email: string;
        type: string;
      };
      if (payload.type !== "customer") {
        throw new UnauthorizedException("Invalid token type");
      }
      req.customerAuth = {
        customerId: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
      };
      return true;
    } catch (err) {
      if (err instanceof UnauthorizedException) throw err;
      throw new UnauthorizedException("Invalid or expired customer token");
    }
  }
}
