import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

/** RFC 7807 Problem Details for HTTP APIs (subset). */
@Catch()
export class ProblemJsonExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ProblemJsonExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let title = "Internal Server Error";
    let detail: string | undefined;
    let extras: Record<string, unknown> = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      title = exception.name;
      if (typeof body === "string") {
        detail = body;
      } else if (typeof body === "object" && body !== null) {
        const o = body as Record<string, unknown>;
        detail = typeof o.message === "string" ? o.message : Array.isArray(o.message) ? JSON.stringify(o.message) : undefined;
        extras = { ...o };
        delete extras.message;
        delete extras.statusCode;
      }
    } else if (exception instanceof Error) {
      detail = exception.message;
      this.logger.error(exception.stack);
    } else {
      detail = "Unknown error";
    }

    const problem = {
      type: `https://api.syspaq.com/problems/${status}`,
      title,
      status,
      detail: detail ?? title,
      instance: req.originalUrl,
      ...extras,
    };

    res.status(status).type("application/problem+json").json(problem);
  }
}
