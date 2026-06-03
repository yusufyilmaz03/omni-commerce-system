import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;
}
