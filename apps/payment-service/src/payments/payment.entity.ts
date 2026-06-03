import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { PaymentStatus } from './payment-status.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  orderId!: string;

  @Column()
  userId!: string;

  @Column({ precision: 10, scale: 2, type: 'decimal' })
  amount!: string;

  @Column({
    default: PaymentStatus.Pending,
    enum: PaymentStatus,
    type: 'enum',
  })
  status!: PaymentStatus;

  @Column({ nullable: true, type: 'text' })
  failureReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
