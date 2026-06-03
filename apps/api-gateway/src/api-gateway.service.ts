import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiGatewayService {
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
