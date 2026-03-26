import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Prisma } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { PrismaService } from "@/prisma/prisma.service";
import { RegisterCustomerDto } from "./dto/register-customer.dto";

@Injectable()
export class CustomerAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService
  ) {}

  async register(tenantId: string, dto: RegisterCustomerDto) {
    const passwordHash = await bcrypt.hash(dto.password, 12);

    try {
      const customer = await this.prisma.$transaction(async (tx) => {
        const casillero = await this.generateCasillero(tenantId, tx);

        return tx.customer.create({
          data: {
            tenantId,
            email: dto.email.toLowerCase().trim(),
            passwordHash,
            firstName: dto.firstName,
            lastName: dto.lastName,
            phone: dto.phone,
            idType: dto.idType,
            idNumber: dto.idNumber,
            casillero,
          },
        });
      });

      return this.sanitize(customer);
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException(
          "A customer with this email already exists for this tenant"
        );
      }
      throw e;
    }
  }

  async login(tenantId: string, email: string, password: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        tenantId,
        email: email.toLowerCase().trim(),
        isActive: true,
      },
    });

    if (!customer) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const valid = await bcrypt.compare(password, customer.passwordHash);
    if (!valid) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const secret = this.config.get<string>("customerJwtSecret");
    const accessToken = jwt.sign(
      {
        sub: customer.id,
        tenantId: customer.tenantId,
        email: customer.email,
        type: "customer",
      },
      secret!,
      { expiresIn: "7d" }
    );

    return {
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 604800,
    };
  }

  async generateCasillero(
    tenantId: string,
    tx: Prisma.TransactionClient
  ): Promise<string> {
    const [result] = await tx.$queryRaw<
      { casillero_prefix: string; casillero_counter: number }[]
    >`
      UPDATE "Tenant"
      SET casillero_counter = casillero_counter + 1, updated_at = NOW()
      WHERE id = ${tenantId}
      RETURNING casillero_prefix, casillero_counter
    `;
    return `${result.casillero_prefix}-${String(result.casillero_counter).padStart(5, "0")}`;
  }

  private sanitize<
    T extends { passwordHash?: unknown },
  >(customer: T): Omit<T, "passwordHash"> {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...rest } = customer;
    return rest as Omit<T, "passwordHash">;
  }
}
