import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { User } from './user.entity';
import { Order } from './order.entity';
import { Position } from './position.entity';
import { LedgerEntry } from './ledger-entry.entity';

@Entity('accounts')
export class Account {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'base_currency', default: 'USD' })
  baseCurrency: string;

  @Column({ name: 'starting_balance', type: 'decimal', precision: 20, scale: 2 })
  startingBalance: number;

  @Column({ name: 'current_balance', type: 'decimal', precision: 20, scale: 2 })
  currentBalance: number;

  @Column({ name: 'account_state', default: 'active' })
  accountState: string;

  @Column({ 
    type: 'jsonb', 
    name: 'leverage_profile', 
    nullable: true,
    default: {},
  })
  leverageProfile: Record<string, number>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Order, order => order.account)
  orders: Order[];

  @OneToMany(() => Position, position => position.account)
  positions: Position[];

  @OneToMany(() => LedgerEntry, entry => entry.account)
  ledgerEntries: LedgerEntry[];
}

