import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimOrUndef = ({ value }: { value: any }) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value; // biar IsString yang nangkep
  const v = value.trim();
  return v === '' ? undefined : v; // kosong => dianggap tidak dikirim
};

export class UpdateProfileDto {
  @IsOptional()
  @Transform(trimOrUndef)
  @IsString()
  @MinLength(3)
  @MaxLength(30)
  username?: string;

  @IsOptional()
  @Transform(trimOrUndef)
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @Transform(trimOrUndef)
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password?: string;

  @IsOptional()
  @Transform(trimOrUndef)
  @IsString()
  @Matches(/^https?:\/\/.+/i, { message: 'image harus berupa URL' })
  image?: string;
}
