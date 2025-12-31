import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';
import { Instrument } from './instrument.entity';

@Entity('positions')
export class Position {
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

  @Column()
  side: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  quantity: number;

  @Column({ name: 'average_entry_price', type: 'decimal', precision: 20, scale: 8 })
  averageEntryPrice: number;

  @Column({ name: 'current_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  currentPrice?: number;

  @Column({ name: 'unrealized_pnl', type: 'decimal', precision: 20, scale: 2, default: 0 })
  unrealizedPnl: number;

  @Column({ name: 'realized_pnl', type: 'decimal', precision: 20, scale: 2, default: 0 })
  realizedPnl: number;

  @Column({ name: 'swap_accrued', type: 'decimal', precision: 20, scale: 2, default: 0 })
  swapAccrued: number;

  @Column({ name: 'take_profit_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  takeProfitPrice?: number;

  @Column({ name: 'stop_loss_price', type: 'decimal', precision: 20, scale: 8, nullable: true })
  stopLossPrice?: number;

  @Column({ name: 'trailing_stop_distance', type: 'decimal', precision: 20, scale: 8, nullable: true })
  trailingStopDistance?: number;

  @CreateDateColumn({ name: 'opened_at' })
  openedAt: Date;

  @Column({ name: 'closed_at', type: 'timestamptz', nullable: true })
  closedAt?: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


