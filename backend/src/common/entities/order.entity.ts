import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';
import { Instrument } from './instrument.entity';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'instrument_id' })
  instrumentId: string;

  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrument_id' })
  instrument: Instrument;

  @Column({ name: 'order_type' })
  orderType: string;

  @Column()
  side: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 20, scale: 8, nullable: true })
  price?: number;

  @Column({ name: 'stop_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  stopPrice?: number;

  @Column({ default: 'pending' })
  status: string;

  @Column({ name: 'filled_quantity', type: 'decimal', precision: 20, scale: 2, default: 0 })
  filledQuantity: number;

  @Column({ name: 'average_fill_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  averageFillPrice?: number;

  @Column({ name: 'time_in_force', default: 'GTC' })
  timeInForce: string;

  @Column({ name: 'expires_at', type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'filled_at', type: 'timestamptz', nullable: true })
  filledAt?: Date;
}


