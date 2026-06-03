import { Controller, Get } from '@nestjs/common';

@Controller()
export class ApiGatewayController {
  @Get()
  getHealth(): { status: string } {
    return { status: 'ok' };
  }
}
