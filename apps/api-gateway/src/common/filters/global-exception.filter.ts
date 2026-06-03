import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  error: string;
  message: string | string[];
  path: string;
  statusCode: number;
  timestamp: string;
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();
    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const exceptionResponse =
      exception instanceof HttpException ? exception.getResponse() : null;

    response.status(statusCode).json({
      error: this.getError(exceptionResponse, statusCode),
      message: this.getMessage(exceptionResponse, exception),
      path: request.url,
      statusCode,
      timestamp: new Date().toISOString(),
    } satisfies ErrorResponseBody);
  }

  private getError(
    exceptionResponse: string | object | null,
    statusCode: number,
  ): string {
    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'error' in exceptionResponse &&
      typeof exceptionResponse.error === 'string'
    ) {
      return exceptionResponse.error;
    }

    return HttpStatus[statusCode] ?? 'Internal Server Error';
  }

  private getMessage(
    exceptionResponse: string | object | null,
    exception: unknown,
  ): string | string[] {
    if (typeof exceptionResponse === 'string') {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === 'object' &&
      'message' in exceptionResponse &&
      (typeof exceptionResponse.message === 'string' ||
        Array.isArray(exceptionResponse.message))
    ) {
      return exceptionResponse.message;
    }

    if (exception instanceof Error) {
      return exception.message;
    }

    return 'Internal server error';
  }
}
