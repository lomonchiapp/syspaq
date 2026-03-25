import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from "@nestjs/common";
import { Request } from "express";

@Injectable()
export class SuperAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request>();
    if (!req.auth?.isSuperAdmin) {
      throw new ForbiddenException("Se requieren permisos de superadmin");
    }
    return true;
  }
}
