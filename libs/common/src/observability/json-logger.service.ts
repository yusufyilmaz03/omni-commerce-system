import { LoggerService } from '@nestjs/common';

type LogLevel = 'debug' | 'error' | 'log' | 'verbose' | 'warn';

export class JsonLogger implements LoggerService {
  constructor(private readonly serviceName: string) {}

  log(message: unknown, context?: string): void {
    this.write('log', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('error', message, context, trace);
  }

  warn(message: unknown, context?: string): void {
    this.write('warn', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('debug', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('verbose', message, context);
  }

  private write(
    level: LogLevel,
    message: unknown,
    context?: string,
    trace?: string,
  ): void {
    const payload = {
      context,
      level,
      message: this.normalizeMessage(message),
      service: this.serviceName,
      timestamp: new Date().toISOString(),
      trace,
    };
    const serializedPayload = JSON.stringify(payload);

    if (level === 'error') {
      console.error(serializedPayload);
      return;
    }

    if (level === 'warn') {
      console.warn(serializedPayload);
      return;
    }

    console.log(serializedPayload);
  }

  private normalizeMessage(message: unknown): unknown {
    if (message instanceof Error) {
      return {
        message: message.message,
        name: message.name,
        stack: message.stack,
      };
    }

    return message;
  }
}
