import { Body, Controller, Get, Param, Post } from '@nestjs/common';

import { CircuitBreakerSnapshot } from './circuit-breaker.service';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Payment } from './payment.entity';
import { PaymentsService } from './payments.service';
import { CircuitBreakerService } from './circuit-breaker.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly circuitBreakerService: CircuitBreakerService,
  ) {}

  @Post('process')
  processPayment(
    @Body() processPaymentDto: ProcessPaymentDto,
  ): Promise<Payment> {
    return this.paymentsService.processPayment(processPaymentDto);
  }

  @Post('refund')
  refundPayment(@Body() refundPaymentDto: RefundPaymentDto): Promise<Payment> {
    return this.paymentsService.refundPayment(refundPaymentDto);
  }

  @Get()
  findAll(): Promise<Payment[]> {
    return this.paymentsService.findAll();
  }

  @Get('circuit-breaker')
  getCircuitBreaker(): CircuitBreakerSnapshot {
    return this.circuitBreakerService.getSnapshot();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Payment> {
    return this.paymentsService.findOne(id);
  }
}
