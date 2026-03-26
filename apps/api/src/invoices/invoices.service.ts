import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateInvoiceDto, CreateInvoiceItemDto } from "./dto/create-invoice.dto";
import { UpdateInvoiceDto } from "./dto/update-invoice.dto";
import { AddInvoiceItemDto } from "./dto/add-invoice-item.dto";

interface ReceptionCharge {
  description: string;
  amount: number;
  currency: string;
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  /* ------------------------------------------------------------------ */
  /*  Helpers                                                            */
  /* ------------------------------------------------------------------ */

  private calculateItemTotals(item: CreateInvoiceItemDto | AddInvoiceItemDto) {
    const subtotal = item.quantity * item.unitPrice;
    const discountPct = item.discountPct ?? 0;
    const discount = subtotal * (discountPct / 100);
    const taxPct = item.taxPct ?? 0;
    const tax = (subtotal - discount) * (taxPct / 100);
    const total = subtotal - discount + tax;

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discount: Math.round(discount * 100) / 100,
      tax: Math.round(tax * 100) / 100,
      total: Math.round(total * 100) / 100,
      discountPct,
      taxPct,
    };
  }

  private sumInvoiceTotals(
    items: { subtotal: number; discount: number; tax: number; total: number }[],
  ) {
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const discountTotal = items.reduce((s, i) => s + i.discount, 0);
    const taxTotal = items.reduce((s, i) => s + i.tax, 0);
    const total = items.reduce((s, i) => s + i.total, 0);

    return {
      subtotal: Math.round(subtotal * 100) / 100,
      discountTotal: Math.round(discountTotal * 100) / 100,
      taxTotal: Math.round(taxTotal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
  }

  private async generateNumber(
    tenantId: string,
    tx: Prisma.TransactionClient,
  ): Promise<string> {
    const count = await tx.invoice.count({ where: { tenantId } });
    return `INV-${String(count + 1).padStart(5, "0")}`;
  }

  private async recalculateTotals(
    invoiceId: string,
    tx: Prisma.TransactionClient,
  ) {
    const items = await tx.invoiceItem.findMany({ where: { invoiceId } });

    const subtotal = items.reduce((s, i) => s + Number(i.subtotal), 0);
    const discountTotal = items.reduce((s, i) => s + Number(i.discount), 0);
    const taxTotal = items.reduce((s, i) => s + Number(i.tax), 0);
    const total = items.reduce((s, i) => s + Number(i.total), 0);

    const invoice = await tx.invoice.findUniqueOrThrow({
      where: { id: invoiceId },
      select: { amountPaid: true },
    });

    const balance = total - Number(invoice.amountPaid);

    await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        subtotal: Math.round(subtotal * 100) / 100,
        discountTotal: Math.round(discountTotal * 100) / 100,
        taxTotal: Math.round(taxTotal * 100) / 100,
        total: Math.round(total * 100) / 100,
        balance: Math.round(balance * 100) / 100,
      },
    });
  }

  private async ensureDraft(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException(
        "This action is only allowed on DRAFT invoices",
      );
    }
    return invoice;
  }

  /* ------------------------------------------------------------------ */
  /*  CRUD                                                               */
  /* ------------------------------------------------------------------ */

  async create(tenantId: string, dto: CreateInvoiceDto) {
    const calculatedItems = dto.items.map((item) => {
      const calc = this.calculateItemTotals(item);
      return { ...item, ...calc };
    });

    const totals = this.sumInvoiceTotals(calculatedItems);

    return this.prisma.$transaction(async (tx) => {
      const number = await this.generateNumber(tenantId, tx);

      try {
        return await tx.invoice.create({
          data: {
            tenantId,
            customerId: dto.customerId,
            number,
            currency: dto.currency ?? "USD",
            exchangeRate: dto.exchangeRate ?? 1,
            paymentTermDays: dto.paymentTermDays ?? 0,
            notes: dto.notes,
            fiscalType: dto.fiscalType,
            subtotal: totals.subtotal,
            discountTotal: totals.discountTotal,
            taxTotal: totals.taxTotal,
            total: totals.total,
            balance: totals.total,
            items: {
              create: calculatedItems.map((item) => ({
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                discountPct: item.discountPct,
                discount: item.discount,
                taxPct: item.taxPct,
                tax: item.tax,
                subtotal: item.subtotal,
                total: item.total,
                shipmentId: item.shipmentId,
                receptionId: item.receptionId,
              })),
            },
          },
          include: { items: true },
        });
      } catch (e) {
        if (
          e instanceof Prisma.PrismaClientKnownRequestError &&
          e.code === "P2002"
        ) {
          // Retry once with a new number on unique constraint violation
          const retryNumber = await this.generateNumber(tenantId, tx);
          return tx.invoice.create({
            data: {
              tenantId,
              customerId: dto.customerId,
              number: retryNumber,
              currency: dto.currency ?? "USD",
              exchangeRate: dto.exchangeRate ?? 1,
              paymentTermDays: dto.paymentTermDays ?? 0,
              notes: dto.notes,
              fiscalType: dto.fiscalType,
              subtotal: totals.subtotal,
              discountTotal: totals.discountTotal,
              taxTotal: totals.taxTotal,
              total: totals.total,
              balance: totals.total,
              items: {
                create: calculatedItems.map((item) => ({
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  discountPct: item.discountPct,
                  discount: item.discount,
                  taxPct: item.taxPct,
                  tax: item.tax,
                  subtotal: item.subtotal,
                  total: item.total,
                  shipmentId: item.shipmentId,
                  receptionId: item.receptionId,
                })),
              },
            },
            include: { items: true },
          });
        }
        throw e;
      }
    });
  }

  async list(
    tenantId: string,
    page = 1,
    limit = 20,
    filters?: {
      customerId?: string;
      status?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.InvoiceWhereInput = {
      tenantId,
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
      ...(filters?.status
        ? { status: filters.status as InvoiceStatus }
        : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            createdAt: {
              ...(filters?.dateFrom
                ? { gte: new Date(filters.dateFrom) }
                : {}),
              ...(filters?.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: {
          customer: { select: { firstName: true, lastName: true, casillero: true } },
        },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: {
        items: true,
        payments: { include: { payment: true } },
        creditNotes: true,
        customer: {
          select: { firstName: true, lastName: true, email: true, casillero: true },
        },
      },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    return invoice;
  }

  async update(tenantId: string, id: string, dto: UpdateInvoiceDto) {
    await this.ensureDraft(tenantId, id);

    const data: Prisma.InvoiceUpdateInput = {};
    if (dto.notes !== undefined) data.notes = dto.notes;
    if (dto.paymentTermDays !== undefined)
      data.paymentTermDays = dto.paymentTermDays;
    if (dto.fiscalType !== undefined) data.fiscalType = dto.fiscalType;

    return this.prisma.invoice.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  async addItem(tenantId: string, invoiceId: string, dto: AddInvoiceItemDto) {
    await this.ensureDraft(tenantId, invoiceId);

    const calc = this.calculateItemTotals(dto);

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.create({
        data: {
          invoiceId,
          description: dto.description,
          quantity: dto.quantity,
          unitPrice: dto.unitPrice,
          discountPct: calc.discountPct,
          discount: calc.discount,
          taxPct: calc.taxPct,
          tax: calc.tax,
          subtotal: calc.subtotal,
          total: calc.total,
          shipmentId: dto.shipmentId,
          receptionId: dto.receptionId,
        },
      });

      await this.recalculateTotals(invoiceId, tx);

      return tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { items: true },
      });
    });
  }

  async removeItem(tenantId: string, invoiceId: string, itemId: string) {
    await this.ensureDraft(tenantId, invoiceId);

    const item = await this.prisma.invoiceItem.findFirst({
      where: { id: itemId, invoiceId },
    });
    if (!item) throw new NotFoundException("Invoice item not found");

    return this.prisma.$transaction(async (tx) => {
      await tx.invoiceItem.delete({ where: { id: itemId } });
      await this.recalculateTotals(invoiceId, tx);

      return tx.invoice.findUniqueOrThrow({
        where: { id: invoiceId },
        include: { items: true },
      });
    });
  }

  async issue(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { items: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== InvoiceStatus.DRAFT) {
      throw new BadRequestException("Only DRAFT invoices can be issued");
    }
    if (invoice.items.length === 0) {
      throw new BadRequestException("Cannot issue an invoice with no items");
    }

    const issuedAt = new Date();
    const dueAt = new Date(issuedAt);
    dueAt.setDate(dueAt.getDate() + invoice.paymentTermDays);

    const result = await this.prisma.$transaction(async (tx) => {
      // Link receptions that have items on this invoice
      const receptionIds = invoice.items
        .map((i) => i.receptionId)
        .filter((rid): rid is string => rid != null);

      if (receptionIds.length > 0) {
        await tx.reception.updateMany({
          where: { id: { in: receptionIds } },
          data: { invoiceId: id },
        });
      }

      return tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.ISSUED,
          issuedAt,
          dueAt,
        },
        include: { items: true },
      });
    });

    this.eventEmitter.emit('invoice.issued', { tenantId, invoiceId: id });

    return result;
  }

  async cancel(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
      include: { payments: true },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");

    if (
      invoice.status !== InvoiceStatus.DRAFT &&
      invoice.status !== InvoiceStatus.ISSUED
    ) {
      throw new BadRequestException(
        "Only DRAFT or ISSUED invoices can be cancelled",
      );
    }

    if (
      invoice.status === InvoiceStatus.ISSUED &&
      invoice.payments.length > 0
    ) {
      throw new BadRequestException(
        "Cannot cancel an issued invoice that has payments",
      );
    }

    return this.prisma.invoice.update({
      where: { id },
      data: { status: InvoiceStatus.CANCELLED },
    });
  }

  async void(tenantId: string, id: string) {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id, tenantId },
    });
    if (!invoice) throw new NotFoundException("Invoice not found");
    if (invoice.status !== InvoiceStatus.ISSUED) {
      throw new BadRequestException("Only ISSUED invoices can be voided");
    }

    return this.prisma.$transaction(async (tx) => {
      // Generate credit note number
      const cnCount = await tx.creditNote.count({ where: { tenantId } });
      const cnNumber = `CN-${String(cnCount + 1).padStart(5, "0")}`;

      // Create automatic full credit note
      await tx.creditNote.create({
        data: {
          tenantId,
          invoiceId: id,
          number: cnNumber,
          reason: "Invoice voided",
          amount: Number(invoice.total),
          currency: invoice.currency,
          status: "APPLIED",
          issuedAt: new Date(),
        },
      });

      return tx.invoice.update({
        where: { id },
        data: {
          status: InvoiceStatus.VOIDED,
          balance: 0,
          amountPaid: Number(invoice.total),
        },
        include: { items: true, creditNotes: true },
      });
    });
  }

  async getCustomerBalance(tenantId: string, customerId: string) {
    const result = await this.prisma.invoice.aggregate({
      where: {
        tenantId,
        customerId,
        status: {
          in: [
            InvoiceStatus.ISSUED,
            InvoiceStatus.PARTIAL,
            InvoiceStatus.OVERDUE,
          ],
        },
      },
      _sum: { balance: true },
    });

    return {
      customerId,
      balance: Number(result._sum.balance ?? 0),
    };
  }

  async generateFromReceptions(
    tenantId: string,
    customerId: string,
    receptionIds: string[],
  ) {
    const receptions = await this.prisma.reception.findMany({
      where: {
        id: { in: receptionIds },
        tenantId,
        customerId,
        invoiceId: null,
      },
    });

    if (receptions.length === 0) {
      throw new BadRequestException(
        "No uninvoiced receptions found for this customer",
      );
    }

    // Build items from reception charges
    const items: CreateInvoiceItemDto[] = [];
    for (const reception of receptions) {
      const charges = (reception.charges as unknown as ReceptionCharge[]) ?? [];
      for (const charge of charges) {
        items.push({
          description: charge.description,
          quantity: 1,
          unitPrice: charge.amount,
          receptionId: reception.id,
        });
      }
    }

    if (items.length === 0) {
      throw new BadRequestException(
        "Selected receptions have no charges to invoice",
      );
    }

    return this.create(tenantId, {
      customerId,
      items,
    });
  }

  /* Used by customer-facing endpoints */
  async listByCustomer(
    tenantId: string,
    customerId: string,
    page = 1,
    limit = 20,
  ) {
    const skip = (page - 1) * limit;
    const where: Prisma.InvoiceWhereInput = { tenantId, customerId };

    const [items, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
        include: { items: true },
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }
}
