import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import {
  FiscalReportStatus,
  FiscalReportType,
  FiscalSequenceType,
  InvoiceStatus,
  Prisma,
} from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSequenceDto } from "./dto/create-sequence.dto";
import { UpdateSequenceDto } from "./dto/update-sequence.dto";

@Injectable()
export class FiscalService {
  constructor(private readonly prisma: PrismaService) {}

  /* ------------------------------------------------------------------ */
  /*  Sequences                                                          */
  /* ------------------------------------------------------------------ */

  async createSequence(tenantId: string, dto: CreateSequenceDto) {
    return this.prisma.fiscalSequence.create({
      data: {
        tenantId,
        type: dto.type,
        prefix: dto.prefix,
        authorizationNumber: dto.authorizationNumber,
        validFrom: new Date(dto.validFrom),
        validUntil: new Date(dto.validUntil),
      },
    });
  }

  async listSequences(tenantId: string) {
    const sequences = await this.prisma.fiscalSequence.findMany({
      where: { tenantId },
      orderBy: { type: "asc" },
    });

    return sequences.map((seq) => ({
      ...seq,
      currentNumber: seq.currentNumber,
    }));
  }

  async getSequence(tenantId: string, id: string) {
    const sequence = await this.prisma.fiscalSequence.findFirst({
      where: { id, tenantId },
    });
    if (!sequence) throw new NotFoundException("Fiscal sequence not found");
    return sequence;
  }

  async updateSequence(tenantId: string, id: string, dto: UpdateSequenceDto) {
    await this.getSequence(tenantId, id);

    const data: Record<string, unknown> = {};
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.validUntil !== undefined) data.validUntil = new Date(dto.validUntil);

    return this.prisma.fiscalSequence.update({
      where: { id },
      data,
    });
  }

  /* ------------------------------------------------------------------ */
  /*  NCF Assignment                                                     */
  /* ------------------------------------------------------------------ */

  async assignNcf(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });

    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.fiscalNumber) {
      throw new BadRequestException("Invoice already has a fiscal number assigned");
    }

    // Determine NCF type from invoice.fiscalType
    const typeMap: Record<string, FiscalSequenceType> = {
      B01: FiscalSequenceType.B01,
      B02: FiscalSequenceType.B02,
      B04: FiscalSequenceType.B04,
      B14: FiscalSequenceType.B14,
      B15: FiscalSequenceType.B15,
    };

    const ncfType = invoice.fiscalType
      ? typeMap[invoice.fiscalType] ?? FiscalSequenceType.B02
      : FiscalSequenceType.B02;

    const now = new Date();

    const sequence = await this.prisma.fiscalSequence.findFirst({
      where: {
        tenantId,
        type: ncfType,
        isActive: true,
        validUntil: { gt: now },
      },
    });

    if (!sequence) {
      throw new BadRequestException(
        `No hay secuencia NCF activa para tipo ${ncfType}`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.fiscalSequence.update({
        where: { id: sequence.id },
        data: { currentNumber: { increment: 1 } },
      });

      const fiscalNumber = `${updated.prefix}${String(updated.currentNumber).padStart(8, "0")}`;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: { fiscalNumber },
      });

      return { invoiceId, fiscalNumber };
    });
  }

  @OnEvent("invoice.issued")
  async handleInvoiceIssued(payload: { tenantId: string; invoiceId: string }) {
    try {
      await this.assignNcf(payload.tenantId, payload.invoiceId);
    } catch {
      // Silently skip if no active sequence found or other error
    }
  }

  /* ------------------------------------------------------------------ */
  /*  DGII Reports                                                       */
  /* ------------------------------------------------------------------ */

  async generate607(tenantId: string, period: string) {
    const { startDate, endDate } = this.parsePeriod(period);

    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        issuedAt: { gte: startDate, lte: endDate },
        status: { notIn: [InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED] },
      },
      include: {
        customer: {
          select: {
            idNumber: true,
            idType: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const rows = invoices.map((inv) => ({
      rnc: inv.customer?.idNumber ?? null,
      tipoId: inv.customer?.idType ?? null,
      ncf: inv.fiscalNumber,
      fechaComprobante: inv.issuedAt,
      montoFacturado: Number(inv.total),
      itbis: Number(inv.taxTotal),
    }));

    const report = await this.prisma.fiscalReport.upsert({
      where: {
        tenantId_type_period: {
          tenantId,
          type: FiscalReportType.REPORT_607,
          period,
        },
      },
      update: {
        data: rows,
        status: FiscalReportStatus.GENERATED,
        generatedAt: new Date(),
      },
      create: {
        tenantId,
        type: FiscalReportType.REPORT_607,
        period,
        data: rows,
        status: FiscalReportStatus.GENERATED,
        generatedAt: new Date(),
      },
    });

    return report;
  }

  async generate606(tenantId: string, period: string) {
    // SysPaq doesn't track supplier invoices — return empty report
    const rows = [] as Prisma.InputJsonValue;

    const report = await this.prisma.fiscalReport.upsert({
      where: {
        tenantId_type_period: {
          tenantId,
          type: FiscalReportType.REPORT_606,
          period,
        },
      },
      update: {
        data: rows,
        status: FiscalReportStatus.GENERATED,
        generatedAt: new Date(),
      },
      create: {
        tenantId,
        type: FiscalReportType.REPORT_606,
        period,
        data: rows,
        status: FiscalReportStatus.GENERATED,
        generatedAt: new Date(),
      },
    });

    return {
      ...report,
      note: "SysPaq no registra facturas de proveedores. Reporte 606 generado vacio.",
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Aging Report                                                       */
  /* ------------------------------------------------------------------ */

  async getAging(tenantId: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        status: {
          in: [InvoiceStatus.ISSUED, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
        },
        balance: { gt: 0 },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            casillero: true,
          },
        },
      },
    });

    const today = new Date();
    const customerMap = new Map<
      string,
      {
        customerId: string;
        customerName: string;
        casillero: string;
        current: number;
        days30: number;
        days60: number;
        days90: number;
        days90Plus: number;
        total: number;
      }
    >();

    for (const inv of invoices) {
      const refDate = inv.dueAt ?? inv.issuedAt ?? inv.createdAt;
      const daysOverdue = Math.floor(
        (today.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      const balance = Number(inv.balance);
      const custId = inv.customerId;

      if (!customerMap.has(custId)) {
        customerMap.set(custId, {
          customerId: custId,
          customerName: `${inv.customer.firstName} ${inv.customer.lastName}`,
          casillero: inv.customer.casillero,
          current: 0,
          days30: 0,
          days60: 0,
          days90: 0,
          days90Plus: 0,
          total: 0,
        });
      }

      const bucket = customerMap.get(custId)!;

      if (daysOverdue <= 0) {
        bucket.current += balance;
      } else if (daysOverdue <= 30) {
        bucket.days30 += balance;
      } else if (daysOverdue <= 60) {
        bucket.days60 += balance;
      } else if (daysOverdue <= 90) {
        bucket.days90 += balance;
      } else {
        bucket.days90Plus += balance;
      }

      bucket.total += balance;
    }

    const customers = Array.from(customerMap.values()).map((c) => ({
      ...c,
      current: Math.round(c.current * 100) / 100,
      days30: Math.round(c.days30 * 100) / 100,
      days60: Math.round(c.days60 * 100) / 100,
      days90: Math.round(c.days90 * 100) / 100,
      days90Plus: Math.round(c.days90Plus * 100) / 100,
      total: Math.round(c.total * 100) / 100,
    }));

    const totals = {
      current: Math.round(customers.reduce((s, c) => s + c.current, 0) * 100) / 100,
      days30: Math.round(customers.reduce((s, c) => s + c.days30, 0) * 100) / 100,
      days60: Math.round(customers.reduce((s, c) => s + c.days60, 0) * 100) / 100,
      days90: Math.round(customers.reduce((s, c) => s + c.days90, 0) * 100) / 100,
      days90Plus: Math.round(customers.reduce((s, c) => s + c.days90Plus, 0) * 100) / 100,
      total: Math.round(customers.reduce((s, c) => s + c.total, 0) * 100) / 100,
    };

    return { customers, totals };
  }

  /* ------------------------------------------------------------------ */
  /*  Fiscal Summary                                                     */
  /* ------------------------------------------------------------------ */

  async getSummary(tenantId: string, period: string) {
    const { startDate, endDate } = this.parsePeriod(period);

    // Total sales & ITBIS
    const salesAgg = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        issuedAt: { gte: startDate, lte: endDate },
        status: { notIn: [InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED] },
      },
      _sum: { total: true, taxTotal: true },
    });

    const totalSales = Number(salesAgg._sum.total ?? 0);
    const totalITBIS = Number(salesAgg._sum.taxTotal ?? 0);

    // Total credit notes
    const cnAgg = await this.prisma.creditNote.aggregate({
      where: {
        tenantId,
        status: "APPLIED",
        issuedAt: { gte: startDate, lte: endDate },
      },
      _sum: { amount: true },
    });

    const totalCreditNotes = Number(cnAgg._sum.amount ?? 0);
    const netSales = Math.round((totalSales - totalCreditNotes) * 100) / 100;

    // NCFs by type
    const invoicesWithNcf = await this.prisma.invoice.findMany({
      where: {
        tenantId,
        issuedAt: { gte: startDate, lte: endDate },
        fiscalNumber: { not: null },
        status: { notIn: [InvoiceStatus.DRAFT, InvoiceStatus.CANCELLED] },
      },
      select: { fiscalType: true },
    });

    const ncfsByType: Record<string, number> = {};
    for (const inv of invoicesWithNcf) {
      const key = inv.fiscalType ?? "B02";
      ncfsByType[key] = (ncfsByType[key] ?? 0) + 1;
    }

    return {
      period,
      totalSales: Math.round(totalSales * 100) / 100,
      totalITBIS: Math.round(totalITBIS * 100) / 100,
      totalCreditNotes: Math.round(totalCreditNotes * 100) / 100,
      netSales,
      ncfsByType,
    };
  }

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  private parsePeriod(period: string) {
    const [year, month] = period.split("-").map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);
    return { startDate, endDate };
  }
}
