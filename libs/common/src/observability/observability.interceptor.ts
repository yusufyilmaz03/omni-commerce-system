import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { catchError, finalize, Observable, throwError } from 'rxjs';
import { MetricsService } from './metrics.service';

@Injectable()
export class ObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly metricsService: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    let statusCode: number | undefined;

    return next.handle().pipe(
      catchError((error: unknown) => {
        statusCode =
          error instanceof HttpException
            ? error.getStatus()
            : response.statusCode;

        return throwError(() => error);
      }),
      finalize(() => {
        const route = this.getRouteLabel(request);

        if (route === '/metrics') {
          return;
        }

        this.metricsService.recordHttpRequest(
          {
            method: request.method,
            route,
            statusCode: String(statusCode ?? response.statusCode),
          },
          Date.now() - startedAt,
        );
      }),
    );
  }

  private getRouteLabel(request: Request): string {
    return request.path;
  }
}
