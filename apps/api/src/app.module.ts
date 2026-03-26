import { MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_FILTER } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { EventEmitterModule } from "@nestjs/event-emitter";
import configuration from "./config/configuration";
import { envValidationSchema } from "./config/env.validation";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { ShipmentsModule } from "./shipments/shipments.module";
import { BranchesModule } from "./branches/branches.module";
import { CustomersModule } from "./customers/customers.module";
import { HealthModule } from "./health/health.module";
import { PreAlertsModule } from "./pre-alerts/pre-alerts.module";
import { ReceptionsModule } from "./receptions/receptions.module";
import { CalculatorModule } from "./calculator/calculator.module";
import { RateTablesModule } from "./rate-tables/rate-tables.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { DocsModule } from "./docs/docs.module";
import { PostAlertsModule } from "./post-alerts/post-alerts.module";
import { DeliveryOrdersModule } from "./delivery-orders/delivery-orders.module";
import { BulkImportModule } from "./bulk-import/bulk-import.module";
import { InvoicesModule } from "./invoices/invoices.module";
import { PaymentGatewayModule } from "./payment-gateway/payment-gateway.module";
import { EcommerceModule } from "./ecommerce/ecommerce.module";
import { ContainersModule } from "./containers/containers.module";
import { DgaModule } from "./dga/dga.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { UsersModule } from "./users/users.module";
import { SettingsModule } from "./settings/settings.module";
import { AdminModule } from "./admin/admin.module";
import { PortalModule } from "./portal/portal.module";
import { CajaChicaModule } from "./caja-chica/caja-chica.module";
import { AuditModule } from "./common/audit/audit.module";
import { ProblemJsonExceptionFilter } from "./common/filters/problem-json.filter";
import { RequestLoggerMiddleware } from "./common/middleware/request-logger.middleware";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validationSchema: envValidationSchema,
      validationOptions: { abortEarly: false },
    }),
    ThrottlerModule.forRoot({
      throttlers: [{ ttl: 60000, limit: 100 }],
    }),
    EventEmitterModule.forRoot(),
    PrismaModule,
    AuditModule,
    AuthModule,
    ShipmentsModule,
    BranchesModule,
    CustomersModule,
    PreAlertsModule,
    ReceptionsModule,
    CalculatorModule,
    RateTablesModule,
    NotificationsModule,
    DocsModule,
    PostAlertsModule,
    DeliveryOrdersModule,
    BulkImportModule,
    InvoicesModule,
    PaymentGatewayModule,
    EcommerceModule,
    ContainersModule,
    DgaModule,
    AnalyticsModule,
    UsersModule,
    SettingsModule,
    AdminModule,
    PortalModule,
    CajaChicaModule,
    HealthModule,
  ],
  providers: [{ provide: APP_FILTER, useClass: ProblemJsonExceptionFilter }],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .exclude("health/(.*)")
      .forRoutes("*");
  }
}
