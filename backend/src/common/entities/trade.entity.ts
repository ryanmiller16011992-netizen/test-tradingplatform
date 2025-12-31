import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';
import { Instrument } from './instrument.entity';

@Entity('trades')
export class Trade {
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

  @Column({ name: 'position_id', nullable: true })
  positionId?: string;

  @Column({ name: 'order_id', nullable: true })
  orderId?: string;

  @Column()
  side: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  quantity: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  price: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  commission: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  swap: number;

  @Column({ name: 'realized_pnl', type: 'decimal', precision: 20, scale: 2, default: 0 })
  realizedPnl: number;

  @Column({ name: 'trade_type' })
  tradeType: string;

  @Column({ name: 'executed_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  executedAt: Date;
}


