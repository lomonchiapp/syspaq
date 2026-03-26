import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { Public } from "../common/decorators/public.decorator";
import { DriverJwtGuard } from "./guards/driver-jwt.guard";
import { MobileService } from "./mobile.service";
import { DriverLoginDto } from "./dto/driver-login.dto";
import { StartSessionDto } from "./dto/start-session.dto";
import { LocationPingDto } from "./dto/location-ping.dto";
import { ScanBarcodeDto } from "./dto/scan-barcode.dto";
import { CompleteMobileDeliveryDto, FailMobileDeliveryDto } from "./dto/complete-delivery.dto";
import { Request } from "express";

@ApiTags("mobile")
@Controller("mobile")
export class MobileController {
  constructor(private readonly mobile: MobileService) {}

  /* ── Auth ── */

  @Public()
  @Post("auth/login")
  @ApiOperation({ summary: "Driver login with phone + PIN" })
  login(@Body() dto: DriverLoginDto) {
    return this.mobile.login(dto);
  }

  /* ── Sessions ── */

  @UseGuards(DriverJwtGuard)
  @Post("sessions/start")
  @ApiOperation({ summary: "Start driver shift" })
  startSession(@Req() req: Request, @Body() dto: StartSessionDto) {
    return this.mobile.startSession(req.driver!.tenantId, req.driver!.driverId, dto);
  }

  @UseGuards(DriverJwtGuard)
  @Post("sessions/end")
  @ApiOperation({ summary: "End driver shift" })
  endSession(@Req() req: Request) {
    return this.mobile.endSession(req.driver!.tenantId, req.driver!.driverId);
  }

  @UseGuards(DriverJwtGuard)
  @Post("sessions/ping")
  @ApiOperation({ summary: "Batch GPS location update" })
  locationPing(@Req() req: Request, @Body() dto: LocationPingDto) {
    return this.mobile.locationPing(req.driver!.tenantId, req.driver!.driverId, dto);
  }

  /* ── Routes ── */

  @UseGuards(DriverJwtGuard)
  @Get("routes/active")
  @ApiOperation({ summary: "Get driver active route" })
  getActiveRoute(@Req() req: Request) {
    return this.mobile.getActiveRoute(req.driver!.tenantId, req.driver!.driverId);
  }

  /* ── Scan ── */

  @UseGuards(DriverJwtGuard)
  @Post("scan")
  @ApiOperation({ summary: "Scan barcode / tracking number" })
  scan(@Req() req: Request, @Body() dto: ScanBarcodeDto) {
    return this.mobile.scan(req.driver!.tenantId, dto);
  }

  /* ── Deliveries ── */

  @UseGuards(DriverJwtGuard)
  @Post("deliveries/:id/arrive")
  @ApiOperation({ summary: "Mark arrived at delivery point" })
  arriveAtDelivery(@Req() req: Request, @Param("id") id: string) {
    return this.mobile.arriveAtDelivery(req.driver!.tenantId, req.driver!.driverId, id);
  }

  @UseGuards(DriverJwtGuard)
  @Post("deliveries/:id/complete")
  @ApiOperation({ summary: "Complete delivery with signature and photo" })
  completeDelivery(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: CompleteMobileDeliveryDto,
  ) {
    return this.mobile.completeDelivery(req.driver!.tenantId, req.driver!.driverId, id, dto);
  }

  @UseGuards(DriverJwtGuard)
  @Post("deliveries/:id/fail")
  @ApiOperation({ summary: "Mark delivery as failed" })
  failDelivery(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: FailMobileDeliveryDto,
  ) {
    return this.mobile.failDelivery(req.driver!.tenantId, req.driver!.driverId, id, dto);
  }

  @UseGuards(DriverJwtGuard)
  @Get("deliveries/pending")
  @ApiOperation({ summary: "Get pending deliveries for today" })
  getPendingDeliveries(@Req() req: Request) {
    return this.mobile.getPendingDeliveries(req.driver!.tenantId, req.driver!.driverId);
  }

  @UseGuards(DriverJwtGuard)
  @Get("summary")
  @ApiOperation({ summary: "Daily driver stats" })
  getDailySummary(@Req() req: Request) {
    return this.mobile.getDailySummary(req.driver!.tenantId, req.driver!.driverId);
  }
}
