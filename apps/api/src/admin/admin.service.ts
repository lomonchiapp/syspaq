import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateTenantDto } from "./dto/update-tenant.dto";
import { RecordPaymentDto } from "./dto/record-payment.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getTenants() {
    return this.prisma.tenant.findMany({
      select: {
        id: true,
        slug: true,
        name: true,
        plan: true,
        planStatus: true,
        trialEndsAt: true,
        periodEnd: true,
        adminNotes: true,
        createdAt: true,
        _count: { select: { customers: true, shipments: true } },
        billingRecords: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { amount: true, currency: true, paidAt: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  async getTenantById(id: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id },
      include: {
        _count: { select: { customers: true, shipments: true, users: true } },
        billingRecords: { orderBy: { createdAt: "desc" } },
        users: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isSuperAdmin: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
      },
    });
    if (!tenant) throw new NotFoundException("Tenant not found");
    return tenant;
  }

  async updateTenant(id: string, dto: UpdateTenantDto) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    return this.prisma.tenant.update({
      where: { id },
      data: {
        ...(dto.plan !== undefined && { plan: dto.plan }),
        ...(dto.planStatus !== undefined && { planStatus: dto.planStatus }),
        ...(dto.periodEnd !== undefined && { periodEnd: new Date(dto.periodEnd) }),
        ...(dto.adminNotes !== undefined && { adminNotes: dto.adminNotes }),
      },
    });
  }

  async recordPayment(tenantId: string, dto: RecordPaymentDto, recordedBy: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    const record = await this.prisma.$transaction(async (tx) => {
      const br = await tx.billingRecord.create({
        data: {
          tenantId,
          amount: dto.amount,
          currency: dto.currency ?? "DOP",
          method: dto.method,
          reference: dto.reference,
          notes: dto.notes,
          periodStart: dto.periodStart ? new Date(dto.periodStart) : undefined,
          periodEnd: dto.periodEnd ? new Date(dto.periodEnd) : undefined,
          recordedBy,
          paidAt: dto.paidAt ? new Date(dto.paidAt) : new Date(),
        },
      });

      // Auto-advance to ACTIVE if currently TRIALING or PAST_DUE
      if (tenant.planStatus === "TRIALING" || tenant.planStatus === "PAST_DUE") {
        await tx.tenant.update({
          where: { id: tenantId },
          data: {
            planStatus: "ACTIVE",
            ...(dto.periodEnd ? { periodEnd: new Date(dto.periodEnd) } : {}),
          },
        });
      }

      return br;
    });

    return record;
  }

  async getPayments(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    if (!tenant) throw new NotFoundException("Tenant not found");

    return this.prisma.billingRecord.findMany({
      where: { tenantId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getStats() {
    const [total, byStatus, mrr] = await Promise.all([
      this.prisma.tenant.count(),
      this.prisma.tenant.groupBy({ by: ["planStatus"], _count: true }),
      this.prisma.billingRecord.aggregate({
        _sum: { amount: true },
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    return {
      totalTenants: total,
      byStatus: Object.fromEntries(byStatus.map((s) => [s.planStatus, s._count])),
      mrrThisMonth: mrr._sum.amount ?? 0,
    };
  }

  async getUpcomingRenewals(days = 30) {
    const until = new Date();
    until.setDate(until.getDate() + days);

    return this.prisma.tenant.findMany({
      where: {
        periodEnd: { lte: until, gte: new Date() },
        planStatus: { in: ["ACTIVE", "PAST_DUE"] },
      },
      select: {
        id: true,
        slug: true,
        name: true,
        plan: true,
        planStatus: true,
        periodEnd: true,
      },
      orderBy: { periodEnd: "asc" },
    });
  }
}
