import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Response } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RequestLoginDto } from './dto/login-request.dto';
import { RegisterResponse } from './type/register-response.type';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(createAuthDto: CreateAuthDto): Promise<RegisterResponse> {
    const saltRounds = this.config.getOrThrow('app.salt');
    const hashed = await bcrypt.hash(createAuthDto.password, saltRounds);

    try {
      const user = await this.prisma.user.create({
        data: {
          username: createAuthDto.username,
          email: createAuthDto.email,
          password: hashed,
        },
        select: { id: true, username: true, email: true },
      });

      return user;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const existing = await this.prisma.user.findFirst({
          where: {
            OR: [
              {
                username: createAuthDto.username,
              },
              {
                email: createAuthDto.email,
              },
            ],
          },
        });
        if (existing) {
          const used: string[] = [];
          if (existing.username === createAuthDto.username)
            used.push('username');
          if (existing.email === createAuthDto.email) used.push('email');

          throw new ConflictException(`${used.join(', ')} sudah digunakan`);
        }
        throw new ConflictException(`username atau email sudah digunakan`);
      }
      throw error;
    }
  }

  async login(requestLoginDto: RequestLoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: requestLoginDto.email },
    });
    if (!user) {
      throw new UnauthorizedException('Email atau Password salah');
    }

    const match = await bcrypt.compare(requestLoginDto.password, user.password);
    if (!match) {
      throw new UnauthorizedException('Email atau Password salah');
    }

    const token = await this.jwtService.signAsync({
      sub: user.id,
      username: user.username,
    });

    return token;
  }

  logout(res: Response) {
    res.clearCookie('access_token');
    return { message: 'Logout berhasil' };
  }
}
