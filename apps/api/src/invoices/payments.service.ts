import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { InvoiceStatus, Prisma } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import { RecordPaymentDto } from "./dto/record-payment.dto";

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async record(tenantId: string, dto: RecordPaymentDto) {
    // Validate that allocation amounts sum to payment amount
    const allocationSum = dto.allocations.reduce((s, a) => s + a.amount, 0);
    if (Math.abs(allocationSum - dto.amount) > 0.01) {
      throw new BadRequestException(
        "Sum of allocation amounts must equal the payment amount",
      );
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // Validate all invoices exist and belong to tenant
      for (const alloc of dto.allocations) {
        const invoice = await tx.invoice.findFirst({
          where: { id: alloc.invoiceId, tenantId },
        });
        if (!invoice) {
          throw new NotFoundException(
            `Invoice ${alloc.invoiceId} not found`,
          );
        }
        if (
          invoice.status !== InvoiceStatus.ISSUED &&
          invoice.status !== InvoiceStatus.PARTIAL &&
          invoice.status !== InvoiceStatus.OVERDUE
        ) {
          throw new BadRequestException(
            `Invoice ${invoice.number} is not in a payable status (${invoice.status})`,
          );
        }
        if (alloc.amount > Number(invoice.balance)) {
          throw new BadRequestException(
            `Allocation amount ${alloc.amount} exceeds invoice ${invoice.number} balance of ${invoice.balance}`,
          );
        }
      }

      // Create the payment
      const payment = await tx.payment.create({
        data: {
          tenantId,
          customerId: dto.customerId ?? null,
          method: dto.method,
          amount: dto.amount,
          currency: dto.currency ?? "USD",
          reference: dto.reference,
          bankName: dto.bankName,
          notes: dto.notes,
          branchId: dto.branchId,
          allocations: {
            create: dto.allocations.map((alloc) => ({
              invoiceId: alloc.invoiceId,
              amount: alloc.amount,
            })),
          },
        },
        include: { allocations: true },
      });

      // Update each invoice
      for (const alloc of dto.allocations) {
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: alloc.invoiceId },
        });

        const newAmountPaid =
          Math.round((Number(invoice.amountPaid) + alloc.amount) * 100) / 100;
        const newBalance =
          Math.round((Number(invoice.total) - newAmountPaid) * 100) / 100;

        const newStatus =
          newBalance <= 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;

        await tx.invoice.update({
          where: { id: alloc.invoiceId },
          data: {
            amountPaid: newAmountPaid,
            balance: Math.max(newBalance, 0),
            status: newStatus,
            ...(newBalance <= 0 ? { paidAt: new Date() } : {}),
          },
        });
      }

      return payment;
    });

    // Emit event for cash payments at a branch
    if (dto.method === "CASH" && dto.branchId) {
      this.eventEmitter.emit("payment.recorded", {
        tenantId,
        paymentId: result.id,
        branchId: dto.branchId,
        method: dto.method,
        amount: Number(dto.amount),
        currency: dto.currency || "USD",
      });
    }

    return result;
  }

  async list(
    tenantId: string,
    page = 1,
    limit = 20,
    filters?: {
      customerId?: string;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const skip = (page - 1) * limit;

    const where: Prisma.PaymentWhereInput = {
      tenantId,
      ...(filters?.customerId ? { customerId: filters.customerId } : {}),
      ...(filters?.dateFrom || filters?.dateTo
        ? {
            paidAt: {
              ...(filters?.dateFrom
                ? { gte: new Date(filters.dateFrom) }
                : {}),
              ...(filters?.dateTo ? { lte: new Date(filters.dateTo) } : {}),
            },
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        orderBy: { paidAt: "desc" },
        skip,
        take: limit,
        include: {
          allocations: {
            include: {
              invoice: { select: { number: true, status: true } },
            },
          },
          customer: { select: { firstName: true, lastName: true } },
        },
      }),
      this.prisma.payment.count({ where }),
    ]);

    return {
      data: items,
      meta: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(tenantId: string, id: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { id, tenantId },
      include: {
        allocations: {
          include: {
            invoice: {
              select: {
                number: true,
                status: true,
                total: true,
                balance: true,
              },
            },
          },
        },
        customer: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
    });
    if (!payment) throw new NotFoundException("Payment not found");
    return payment;
  }
}
