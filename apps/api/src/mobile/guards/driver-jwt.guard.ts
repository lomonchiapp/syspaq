import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as jwt from "jsonwebtoken";
import { Request } from "express";

export interface DriverAuthContext {
  driverId: string;
  tenantId: string;
}

declare global {
  namespace Express {
    interface Request {
      driver?: DriverAuthContext;
    }
  }
}

@Injectable()
export class DriverJwtGuard implements CanActivate {
  constructor(private readonly config: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing driver token");
    }

    const token = authHeader.slice(7);
    const secret = this.config.get<string>("jwtSecret");

    try {
      const payload = jwt.verify(token, secret!) as {
        sub: string;
        tenantId: string;
        type: string;
      };

      if (payload.type !== "driver") {
        throw new UnauthorizedException("Invalid token type");
      }

      req.driver = {
        driverId: payload.sub,
        tenantId: payload.tenantId,
      };

      return true;
    } catch {
      throw new UnauthorizedException("Invalid or expired driver token");
    }
  }
}
