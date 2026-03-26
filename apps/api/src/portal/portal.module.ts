import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { TicketsModule } from "@/tickets/tickets.module";
import { PortalController } from "./portal.controller";
import { PortalService } from "./portal.service";
import { CustomerJwtGuard } from "./guards/customer-jwt.guard";

@Module({
  imports: [PrismaModule, TicketsModule],
  controllers: [PortalController],
  providers: [PortalService, CustomerJwtGuard],
})
export class PortalModule {}
