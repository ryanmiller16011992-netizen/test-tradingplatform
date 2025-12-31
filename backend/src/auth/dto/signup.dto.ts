import { IsEmail, IsString, MinLength, IsNumber, Min, IsOptional } from 'class-validator';

export class SignupDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string;

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @IsOptional()
  @IsNumber()
  @Min(1000, { message: 'Starting balance must be at least $1,000' })
  startingBalance?: number;
}

