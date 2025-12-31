import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Order } from './order.entity';
import { Position } from './position.entity';
import { Trade } from './trade.entity';
import { Candle } from './candle.entity';

@Entity('instruments')
export class Instrument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  symbol: string;

  @Column()
  name: string;

  @Column({ name: 'asset_class' })
  assetClass: string;

  @Column({ name: 'quote_currency' })
  quoteCurrency: string;

  @Column({ name: 'price_precision', default: 5 })
  pricePrecision: number;

  @Column({ name: 'min_lot', type: 'decimal', precision: 10, scale: 2, default: 0.01 })
  minLot: number;

  @Column({ name: 'lot_step', type: 'decimal', precision: 10, scale: 2, default: 0.01 })
  lotStep: number;

  @Column({ name: 'contract_size', type: 'decimal', precision: 20, scale: 2, default: 1.0 })
  contractSize: number;

  @Column({ name: 'margin_rate', type: 'decimal', precision: 10, scale: 4, nullable: true })
  marginRate?: number;

  @Column({ nullable: true })
  leverage?: number;

  @Column({ name: 'swap_long_rate', type: 'decimal', precision: 10, scale: 6, default: 0 })
  swapLongRate: number;

  @Column({ name: 'swap_short_rate', type: 'decimal', precision: 10, scale: 6, default: 0 })
  swapShortRate: number;

  @Column({ name: 'spread_model', default: 'fixed' })
  spreadModel: string;

  @Column({ type: 'jsonb', name: 'spread_config', default: {} })
  spreadConfig: Record<string, any>;

  @Column({ type: 'jsonb', name: 'trading_hours', default: {} })
  tradingHours: Record<string, any>;

  @Column({ name: 'commission_per_lot', type: 'decimal', precision: 10, scale: 2, default: 0 })
  commissionPerLot: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Order, order => order.instrument)
  orders: Order[];

  @OneToMany(() => Position, position => position.instrument)
  positions: Position[];

  @OneToMany(() => Trade, trade => trade.instrument)
  trades: Trade[];

  @OneToMany(() => Candle, candle => candle.instrument)
  candles: Candle[];
}


