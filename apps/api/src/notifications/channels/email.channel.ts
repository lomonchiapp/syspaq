import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";

@Injectable()
export class EmailChannel {
  private readonly logger = new Logger(EmailChannel.name);
  private transporter: nodemailer.Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>("SMTP_HOST");
    const port = this.config.get<number>("SMTP_PORT");
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");

    if (host && port) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: user && pass ? { user, pass } : undefined,
      });
      this.logger.log(`SMTP transport configured (${host}:${port})`);
    } else {
      this.logger.warn(
        "SMTP not configured — email sending will be skipped. Set SMTP_HOST and SMTP_PORT."
      );
    }
  }

  async send(
    to: string,
    subject: string,
    body: string
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.transporter) {
      this.logger.warn("SMTP not configured, skipping email send");
      return { success: false, error: "SMTP not configured" };
    }

    try {
      const from =
        this.config.get<string>("SMTP_FROM") ||
        this.config.get<string>("SMTP_USER") ||
        "noreply@syspaq.com";

      await this.transporter.sendMail({
        from,
        to,
        subject,
        html: body,
      });

      return { success: true };
    } catch (err: any) {
      this.logger.error(`Failed to send email to ${to}: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
