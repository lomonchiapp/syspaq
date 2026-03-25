import { RequestMethod, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn", "log"],
  });

  const config = app.get(ConfigService);

  // CORS — configurable via CORS_ORIGINS env (comma-separated), defaults to allow all
  const corsOrigins = config.get<string>("corsOrigins");
  if (corsOrigins) {
    app.enableCors({ origin: corsOrigins.split(",").map((o) => o.trim()) });
  } else {
    app.enableCors({ origin: true });
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  app.setGlobalPrefix("v1", {
    exclude: [
      { path: "health/live", method: RequestMethod.GET },
      { path: "health/ready", method: RequestMethod.GET },
      { path: "docs", method: RequestMethod.GET },
      { path: "swagger", method: RequestMethod.GET },
      { path: "swagger-json", method: RequestMethod.GET },
      { path: "openapi.json", method: RequestMethod.GET },
    ],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle("SysPaq Courier API")
    .setDescription(
      "API REST multi-tenant para tracking de envíos, clientes, casilleros, pre-alertas y más. " +
      "Autenticación: `X-Api-Key` + `X-Tenant-Id`, Bearer JWT desde `POST /v1/auth/token`, " +
      "o Customer JWT desde `POST /v1/customers/login`."
    )
    .setVersion("1.0.0")
    .addApiKey({ type: "apiKey", name: "X-Api-Key", in: "header" })
    .addApiKey({ type: "apiKey", name: "X-Tenant-Id", in: "header" })
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup("swagger", app, document, {
    jsonDocumentUrl: "openapi.json",
    swaggerOptions: { persistAuthorization: true },
  });

  const port = config.get<number>("port") ?? 3001;
  await app.listen(port);
  console.warn(`SysPaq API listening on http://localhost:${port}`);
  console.warn(`Documentación: http://localhost:${port}/docs`);
  console.warn(`Swagger UI: http://localhost:${port}/swagger`);
}

bootstrap();
