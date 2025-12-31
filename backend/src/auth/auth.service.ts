import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { User } from '../common/entities/user.entity';
import { Account } from '../common/entities/account.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Get user's primary account
    const account = await this.accountRepository.findOne({
      where: { userId: user.id },
      order: { createdAt: 'ASC' },
    });

    return {
      id: user.id,
      email: user.email,
      accountId: account?.id,
    };
  }

  async login(user: any) {
    const payload = { email: user.email, sub: user.id, accountId: user.accountId };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        accountId: user.accountId,
      },
    };
  }

  async signup(email: string, password: string, startingBalance: number = 10000): Promise<any> {
    try {
      // Validate inputs
      if (!email || !email.includes('@')) {
        throw new BadRequestException('Please provide a valid email address');
      }
      if (!password || password.length < 6) {
        throw new BadRequestException('Password must be at least 6 characters long');
      }
      if (startingBalance < 1000) {
        throw new BadRequestException('Starting balance must be at least $1,000');
      }

      // Check if user exists
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        throw new BadRequestException('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const user = this.userRepository.create({
        email,
        passwordHash,
      });
      const savedUser = await this.userRepository.save(user);

      // Create account
      const leverageProfile = {
        fx: 100,
        indices: 50,
        metals: 50,
        crypto: 10,
        stocks: 5,
      };
      const account = this.accountRepository.create({
        userId: savedUser.id,
        baseCurrency: 'USD',
        startingBalance,
        currentBalance: startingBalance,
        leverageProfile: leverageProfile as any,
      });
      const savedAccount = await this.accountRepository.save(account);

      return this.login({
        id: savedUser.id,
        email: savedUser.email,
        accountId: savedAccount.id,
      });
    } catch (error: any) {
      // Re-throw BadRequestException and UnauthorizedException as-is
      if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
        throw error;
      }
      // Wrap other errors
      console.error('Signup error:', error);
      throw new BadRequestException(error.message || 'Failed to create account. Please try again.');
    }
  }
}

