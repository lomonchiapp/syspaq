import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { Request } from "express";

export interface CustomerAuthContext {
  customerId: string;
  tenantId: string;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      customer?: CustomerAuthContext;
    }
  }
}

@Injectable()
export class CustomerJwtGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing customer token");
    }

    const token = authHeader.slice(7);
    const secret = this.config.get<string>("customerJwtSecret");

    try {
      const payload = jwt.verify(token, secret!) as {
        sub: string;
        tenantId: string;
        email: string;
        type: string;
      };

      if (payload.type !== "customer") {
        throw new UnauthorizedException("Invalid token type");
      }

      req.customer = {
        customerId: payload.sub,
        tenantId: payload.tenantId,
        email: payload.email,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired customer token");
    }
  }
}
