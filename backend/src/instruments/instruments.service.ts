import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Instrument } from '../common/entities/instrument.entity';

@Injectable()
export class InstrumentsService {
  constructor(
    @InjectRepository(Instrument)
    private instrumentRepository: Repository<Instrument>,
  ) {}

  async findAll(): Promise<Instrument[]> {
    return this.instrumentRepository.find({
      where: { isActive: true },
      order: { symbol: 'ASC' },
    });
  }

  async findOne(id: string): Promise<Instrument> {
    return this.instrumentRepository.findOne({ where: { id } });
  }

  async findBySymbol(symbol: string): Promise<Instrument> {
    return this.instrumentRepository.findOne({ where: { symbol } });
  }

  async create(instrument: Partial<Instrument>): Promise<Instrument> {
    const newInstrument = this.instrumentRepository.create(instrument);
    return this.instrumentRepository.save(newInstrument);
  }

  async update(id: string, updates: Partial<Instrument>): Promise<Instrument> {
    await this.instrumentRepository.update(id, updates);
    return this.findOne(id);
  }

  async delete(id: string): Promise<void> {
    await this.instrumentRepository.delete(id);
  }

  async seedDefaultInstruments(): Promise<void> {
    const defaultInstruments = [
      // Major FX Pairs
      { symbol: 'EURUSD', name: 'Euro / US Dollar', assetClass: 'fx', quoteCurrency: 'USD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0001, swapShortRate: 0.0001, spreadModel: 'fixed', spreadConfig: { fixed: 0.0002 } },
      { symbol: 'GBPUSD', name: 'British Pound / US Dollar', assetClass: 'fx', quoteCurrency: 'USD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0003 } },
      { symbol: 'USDJPY', name: 'US Dollar / Japanese Yen', assetClass: 'fx', quoteCurrency: 'JPY', pricePrecision: 3, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0001, swapShortRate: 0.0001, spreadModel: 'fixed', spreadConfig: { fixed: 0.03 } },
      { symbol: 'USDCHF', name: 'US Dollar / Swiss Franc', assetClass: 'fx', quoteCurrency: 'CHF', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0001, swapShortRate: 0.0001, spreadModel: 'fixed', spreadConfig: { fixed: 0.0003 } },
      { symbol: 'AUDUSD', name: 'Australian Dollar / US Dollar', assetClass: 'fx', quoteCurrency: 'USD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0003 } },
      { symbol: 'NZDUSD', name: 'New Zealand Dollar / US Dollar', assetClass: 'fx', quoteCurrency: 'USD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0004 } },
      { symbol: 'USDCAD', name: 'US Dollar / Canadian Dollar', assetClass: 'fx', quoteCurrency: 'CAD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0001, swapShortRate: 0.0001, spreadModel: 'fixed', spreadConfig: { fixed: 0.0003 } },
      
      // Cross Pairs
      { symbol: 'EURGBP', name: 'Euro / British Pound', assetClass: 'fx', quoteCurrency: 'GBP', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0001, swapShortRate: 0.0001, spreadModel: 'fixed', spreadConfig: { fixed: 0.0003 } },
      { symbol: 'EURJPY', name: 'Euro / Japanese Yen', assetClass: 'fx', quoteCurrency: 'JPY', pricePrecision: 3, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0001, swapShortRate: 0.0001, spreadModel: 'fixed', spreadConfig: { fixed: 0.5 } },
      { symbol: 'GBPJPY', name: 'British Pound / Japanese Yen', assetClass: 'fx', quoteCurrency: 'JPY', pricePrecision: 3, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.8 } },
      { symbol: 'GBPAUD', name: 'British Pound / Australian Dollar', assetClass: 'fx', quoteCurrency: 'AUD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0019 } },
      { symbol: 'GBPCAD', name: 'British Pound / Canadian Dollar', assetClass: 'fx', quoteCurrency: 'CAD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0015 } },
      { symbol: 'GBPCHF', name: 'British Pound / Swiss Franc', assetClass: 'fx', quoteCurrency: 'CHF', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0010 } },
      { symbol: 'GBPNZD', name: 'British Pound / New Zealand Dollar', assetClass: 'fx', quoteCurrency: 'NZD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0032 } },
      { symbol: 'EURTRY', name: 'Euro / Turkish Lira', assetClass: 'fx', quoteCurrency: 'TRY', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 50, swapLongRate: -0.001, swapShortRate: 0.001, spreadModel: 'fixed', spreadConfig: { fixed: 0.3560 } },
      { symbol: 'NZDCAD', name: 'New Zealand Dollar / Canadian Dollar', assetClass: 'fx', quoteCurrency: 'CAD', pricePrecision: 5, minLot: 0.01, lotStep: 0.01, contractSize: 100000, leverage: 100, swapLongRate: -0.0002, swapShortRate: 0.0002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0008 } },
      
      // Indices
      { symbol: 'US100', name: 'US 100 Index (Nasdaq)', assetClass: 'indices', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 2.0 } },
      { symbol: 'SPX500', name: 'S&P 500 Index', assetClass: 'indices', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 1.5 } },
      { symbol: 'US30', name: 'US 30 Index (Dow Jones)', assetClass: 'indices', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 3.0 } },
      { symbol: 'UK100', name: 'UK 100 Index (FTSE)', assetClass: 'indices', quoteCurrency: 'GBP', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 2.5 } },
      { symbol: 'GER40', name: 'Germany 40 Index (DAX)', assetClass: 'indices', quoteCurrency: 'EUR', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 2.0 } },
      { symbol: 'FRA40', name: 'France 40 Index (CAC)', assetClass: 'indices', quoteCurrency: 'EUR', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 2.0 } },
      { symbol: 'JPN225', name: 'Japan 225 Index (Nikkei)', assetClass: 'indices', quoteCurrency: 'JPY', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 15.0 } },
      { symbol: 'AUS200', name: 'Australia 200 Index', assetClass: 'indices', quoteCurrency: 'AUD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 50, swapLongRate: -0.0005, swapShortRate: 0.0005, spreadModel: 'fixed', spreadConfig: { fixed: 2.5 } },
      
      // Metals
      { symbol: 'XAUUSD', name: 'Gold / US Dollar', assetClass: 'metals', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 100, leverage: 50, swapLongRate: -0.001, swapShortRate: 0.001, spreadModel: 'fixed', spreadConfig: { fixed: 0.5 } },
      { symbol: 'XAGUSD', name: 'Silver / US Dollar', assetClass: 'metals', quoteCurrency: 'USD', pricePrecision: 3, minLot: 0.01, lotStep: 0.01, contractSize: 5000, leverage: 50, swapLongRate: -0.001, swapShortRate: 0.001, spreadModel: 'fixed', spreadConfig: { fixed: 0.03 } },
      { symbol: 'XPTUSD', name: 'Platinum / US Dollar', assetClass: 'metals', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 100, leverage: 50, swapLongRate: -0.001, swapShortRate: 0.001, spreadModel: 'fixed', spreadConfig: { fixed: 1.0 } },
      { symbol: 'XPDUSD', name: 'Palladium / US Dollar', assetClass: 'metals', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 100, leverage: 50, swapLongRate: -0.001, swapShortRate: 0.001, spreadModel: 'fixed', spreadConfig: { fixed: 2.0 } },
      
      // Crypto
      { symbol: 'BTCUSD', name: 'Bitcoin / US Dollar', assetClass: 'crypto', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 10, swapLongRate: -0.002, swapShortRate: 0.002, spreadModel: 'fixed', spreadConfig: { fixed: 50 } },
      { symbol: 'ETHUSD', name: 'Ethereum / US Dollar', assetClass: 'crypto', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 10, swapLongRate: -0.002, swapShortRate: 0.002, spreadModel: 'fixed', spreadConfig: { fixed: 5 } },
      { symbol: 'LTCUSD', name: 'Litecoin / US Dollar', assetClass: 'crypto', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 10, swapLongRate: -0.002, swapShortRate: 0.002, spreadModel: 'fixed', spreadConfig: { fixed: 2 } },
      { symbol: 'XRPUSD', name: 'Ripple / US Dollar', assetClass: 'crypto', quoteCurrency: 'USD', pricePrecision: 4, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 10, swapLongRate: -0.002, swapShortRate: 0.002, spreadModel: 'fixed', spreadConfig: { fixed: 0.0005 } },
      
      // Stocks (Major)
      { symbol: 'AAPL', name: 'Apple Inc.', assetClass: 'stocks', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 5, swapLongRate: -0.0003, swapShortRate: 0.0003, spreadModel: 'fixed', spreadConfig: { fixed: 0.05 } },
      { symbol: 'GOOGL', name: 'Alphabet Inc.', assetClass: 'stocks', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 5, swapLongRate: -0.0003, swapShortRate: 0.0003, spreadModel: 'fixed', spreadConfig: { fixed: 0.10 } },
      { symbol: 'MSFT', name: 'Microsoft Corporation', assetClass: 'stocks', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 5, swapLongRate: -0.0003, swapShortRate: 0.0003, spreadModel: 'fixed', spreadConfig: { fixed: 0.08 } },
      { symbol: 'TSLA', name: 'Tesla Inc.', assetClass: 'stocks', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 5, swapLongRate: -0.0003, swapShortRate: 0.0003, spreadModel: 'fixed', spreadConfig: { fixed: 0.15 } },
      { symbol: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'stocks', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 5, swapLongRate: -0.0003, swapShortRate: 0.0003, spreadModel: 'fixed', spreadConfig: { fixed: 0.12 } },
      { symbol: 'META', name: 'Meta Platforms Inc.', assetClass: 'stocks', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 5, swapLongRate: -0.0003, swapShortRate: 0.0003, spreadModel: 'fixed', spreadConfig: { fixed: 0.10 } },
      { symbol: 'NVDA', name: 'NVIDIA Corporation', assetClass: 'stocks', quoteCurrency: 'USD', pricePrecision: 2, minLot: 0.01, lotStep: 0.01, contractSize: 1, leverage: 5, swapLongRate: -0.0003, swapShortRate: 0.0003, spreadModel: 'fixed', spreadConfig: { fixed: 0.20 } },
    ];

    for (const inst of defaultInstruments) {
      const existing = await this.findBySymbol(inst.symbol);
      if (!existing) {
        await this.create(inst);
      }
    }
  }
}

