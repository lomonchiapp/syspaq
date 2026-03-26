import { Module } from "@nestjs/common";
import { DriversController } from "./drivers.controller";
import { VehiclesController } from "./vehicles.controller";
import { RoutesController } from "./routes.controller";
import { DriversService } from "./drivers.service";
import { VehiclesService } from "./vehicles.service";
import { RoutesService } from "./routes.service";

@Module({
  controllers: [DriversController, VehiclesController, RoutesController],
  providers: [DriversService, VehiclesService, RoutesService],
  exports: [DriversService, VehiclesService, RoutesService],
})
export class FleetModule {}
