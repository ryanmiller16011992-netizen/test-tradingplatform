import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { Instrument } from './instrument.entity';

@Entity('candles')
@Index(['instrumentId', 'timeframe', 'openTime'], { unique: true })
export class Candle {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'instrument_id' })
  instrumentId: string;

  @ManyToOne(() => Instrument)
  @JoinColumn({ name: 'instrument_id' })
  instrument: Instrument;

  @Column()
  timeframe: string;

  @Column({ name: 'open_time', type: 'timestamptz' })
  openTime: Date;

  @Column({ name: 'close_time', type: 'timestamptz' })
  closeTime: Date;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  open: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  high: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  low: number;

  @Column({ type: 'decimal', precision: 20, scale: 8 })
  close: number;

  @Column({ type: 'decimal', precision: 20, scale: 2, default: 0 })
  volume: number;
}


