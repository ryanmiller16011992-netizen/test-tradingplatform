import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Account } from './account.entity';

@Entity('ledger_entries')
export class LedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => Account)
  @JoinColumn({ name: 'account_id' })
  account: Account;

  @Column({ name: 'entry_type' })
  entryType: string;

  @Column({ type: 'decimal', precision: 20, scale: 2 })
  amount: number;

  @Column({ name: 'balance_after', type: 'decimal', precision: 20, scale: 2 })
  balanceAfter: number;

  @Column({ name: 'reference_id', nullable: true })
  referenceId?: string;

  @Column({ name: 'reference_type', nullable: true })
  referenceType?: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: {} })
  metadata: Record<string, any>;

  @Column({ name: 'created_at', type: 'timestamptz', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}


