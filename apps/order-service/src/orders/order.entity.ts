import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { OrderStatus } from './order-status.enum';

export interface OrderItem {
  productId: string;
  quantity: number;
  unitPrice: number;
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  userId!: string;

  @Column({ type: 'simple-json' })
  items!: OrderItem[];

  @Column({ precision: 10, scale: 2, type: 'decimal' })
  totalAmount!: string;

  @Column({
    default: OrderStatus.Created,
    enum: OrderStatus,
    type: 'enum',
  })
  status!: OrderStatus;

  @Column({ nullable: true, type: 'text' })
  failureReason?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
