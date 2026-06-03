import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class ProcessPaymentDto {
  @IsString()
  @IsNotEmpty()
  orderId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  shouldFail = false;
}
