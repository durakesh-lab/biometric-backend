import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

/**
 * Global exception filter — gives every error a consistent JSON envelope and
 * proper HTTP status. Nest HttpExceptions keep their status/message; anything
 * else (incl. `throw new Error(...)`) becomes a generic 500 (no stack leak in prod).
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Exception');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const res = ctx.getResponse<Response>();
    const req = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === 'string') {
        message = body;
      } else if (body && typeof body === 'object') {
        message = (body as any).message ?? message;
        error = (body as any).error ?? error;
      }
    } else if (exception instanceof Error) {
      // Non-HTTP error (e.g. `throw new Error('User not found')`).
      // Log the detail server-side; return a generic message to the client.
      this.logger.error(exception.message, exception.stack);
      message =
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : exception.message;
    }

    res.status(status).json({
      statusCode: status,
      error,
      message,
      path: req.url,
      timestamp: new Date().toISOString(),
    });
  }
}
