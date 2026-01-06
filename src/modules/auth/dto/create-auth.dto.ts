import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const trimOrUndef = ({ value }: { value: any }) => {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== 'string') return value; // biar IsString yang nangkep
  const v = value.trim();
  return v === '' ? undefined : v; // kosong => dianggap tidak dikirim
};
export class CreateAuthDto {
  //decorator swagger
  @ApiProperty({
    example: 'example',
    description: 'Nama user',
  })
  @Transform(trimOrUndef)
  @IsString()
  @IsNotEmpty({ message: 'username wajib diisi' })
  @MinLength(3)
  @MaxLength(30)
  username: string;

  @ApiProperty({
    example: 'example@mail.com',
    description: 'email user',
  })
  @Transform(trimOrUndef)
  @IsEmail({}, { message: 'email tidak valid' })
  @IsString()
  @IsNotEmpty({ message: 'email wajib diisi' })
  @MaxLength(254)
  email: string;

  @Transform(trimOrUndef)
  @IsString()
  @IsNotEmpty({ message: 'password wajib diisi' })
  @MinLength(8)
  @MaxLength(72)
  password: string;

  
}
