import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Req,
  UseGuards,
} from "@nestjs/common";
import { ApiOperation, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { Public } from "@/common/decorators/public.decorator";
import { PortalService } from "./portal.service";
import { TicketsService } from "@/tickets/tickets.service";
import { RegisterCustomerDto } from "@/customers/dto/register-customer.dto";
import { CreatePortalTicketDto } from "@/tickets/dto/create-portal-ticket.dto";
import { PortalLoginDto } from "./dto/portal-login.dto";
import { CustomerJwtGuard } from "./guards/customer-jwt.guard";

@ApiTags("portal")
@Controller("portal")
export class PortalController {
  constructor(
    private readonly portal: PortalService,
    private readonly tickets: TicketsService,
  ) {}

  // ── Public endpoints (no tenant auth) ──────────────────────────

  @Public()
  @Get(":slug/config")
  @ApiOperation({ summary: "Get tenant portal branding (public)" })
  getConfig(@Param("slug") slug: string) {
    return this.portal.getConfig(slug);
  }

  @Public()
  @Post(":slug/auth/login")
  @ApiOperation({ summary: "Customer login for tenant portal" })
  login(@Param("slug") slug: string, @Body() dto: PortalLoginDto) {
    return this.portal.login(slug, dto);
  }

  @Public()
  @Post(":slug/auth/register")
  @ApiOperation({ summary: "Customer self-registration" })
  register(@Param("slug") slug: string, @Body() dto: RegisterCustomerDto) {
    return this.portal.register(slug, dto);
  }

  @Public()
  @Get(":slug/tracking/:trackingNumber")
  @ApiOperation({ summary: "Public shipment tracking by number" })
  publicTracking(
    @Param("slug") slug: string,
    @Param("trackingNumber") trackingNumber: string,
  ) {
    return this.portal.publicTracking(slug, trackingNumber);
  }

  // ── Protected customer endpoints ────────────────────────────────

  @UseGuards(CustomerJwtGuard)
  @Get("me")
  @ApiOperation({ summary: "Get logged-in customer profile" })
  getMe(@Req() req: Request) {
    return this.portal.getMe(req.customer!.customerId, req.customer!.tenantId);
  }

  @UseGuards(CustomerJwtGuard)
  @Get("me/shipments")
  @ApiOperation({ summary: "List customer shipments" })
  getShipments(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.portal.getShipments(
      req.customer!.customerId,
      req.customer!.tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @UseGuards(CustomerJwtGuard)
  @Get("me/shipments/:id")
  @ApiOperation({ summary: "Get shipment with full tracking history" })
  getShipmentTracking(@Req() req: Request, @Param("id") id: string) {
    return this.portal.getShipmentTracking(
      req.customer!.customerId,
      req.customer!.tenantId,
      id,
    );
  }

  @UseGuards(CustomerJwtGuard)
  @Get("me/invoices")
  @ApiOperation({ summary: "List customer invoices" })
  getInvoices(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.portal.getInvoices(
      req.customer!.customerId,
      req.customer!.tenantId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  // ── Ticket endpoints ─────────────────────────────────────────────

  @UseGuards(CustomerJwtGuard)
  @Post("me/tickets")
  @ApiOperation({ summary: "Create a support ticket" })
  createTicket(@Req() req: Request, @Body() dto: CreatePortalTicketDto) {
    return this.tickets.create(
      req.customer!.tenantId,
      { ...dto, customerId: req.customer!.customerId },
      req.customer!.customerId,
      req.customer!.email,
    );
  }

  @UseGuards(CustomerJwtGuard)
  @Get("me/tickets")
  @ApiOperation({ summary: "List customer tickets" })
  getMyTickets(
    @Req() req: Request,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    return this.tickets.listByCustomer(
      req.customer!.tenantId,
      req.customer!.customerId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
    );
  }

  @UseGuards(CustomerJwtGuard)
  @Get("me/tickets/:id")
  @ApiOperation({ summary: "Get ticket detail" })
  getMyTicket(@Req() req: Request, @Param("id") id: string) {
    return this.tickets.findOneForCustomer(
      req.customer!.tenantId,
      req.customer!.customerId,
      id,
    );
  }

  @UseGuards(CustomerJwtGuard)
  @Post("me/tickets/:id/comments")
  @ApiOperation({ summary: "Add comment to ticket" })
  addMyTicketComment(
    @Req() req: Request,
    @Param("id") id: string,
    @Body() dto: { body: string },
  ) {
    return this.tickets.addCustomerComment(
      req.customer!.tenantId,
      req.customer!.customerId,
      id,
      dto.body,
    );
  }
}
