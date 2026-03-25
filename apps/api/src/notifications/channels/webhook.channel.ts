import { Injectable, Logger } from "@nestjs/common";
import { createHmac } from "crypto";

@Injectable()
export class WebhookChannel {
  private readonly logger = new Logger(WebhookChannel.name);

  async send(
    url: string,
    secret: string,
    event: string,
    payload: Record<string, any>
  ): Promise<{ success: boolean; statusCode?: number; error?: string }> {
    try {
      const bodyStr = JSON.stringify(payload);
      const signature = createHmac("sha256", secret)
        .update(bodyStr)
        .digest("hex");

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SysPaq-Event": event,
          "X-SysPaq-Signature": `sha256=${signature}`,
        },
        body: bodyStr,
        signal: AbortSignal.timeout(10_000),
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => "");
        this.logger.warn(
          `Webhook ${url} returned ${response.status}: ${errorText.slice(0, 200)}`
        );
        return {
          success: false,
          statusCode: response.status,
          error: `HTTP ${response.status}`,
        };
      }

      return { success: true, statusCode: response.status };
    } catch (err: any) {
      this.logger.error(`Webhook delivery to ${url} failed: ${err.message}`);
      return { success: false, error: err.message };
    }
  }
}
