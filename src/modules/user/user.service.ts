import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './type/jwt-payload.type';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  async getMe(userId: string) {
    return await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        profile: { select: { image: true } },
      },
    });
  }

  async updateProfile(req: Request, dto: UpdateProfileDto) {
    const userId = (req.user as JwtPayload).sub;

    // kalau DTO kamu sudah trim & menolak kosong, ini cukup
    const hasUpdate =
      dto.username !== undefined ||
      dto.email !== undefined ||
      dto.password !== undefined ||
      dto.image !== undefined;

    if (!hasUpdate) {
      throw new BadRequestException('Tidak ada data yang akan diupdate');
    }

    try {
      const data: Prisma.UserUpdateInput = {
        ...(dto.username !== undefined ? { username: dto.username } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.image !== undefined
          ? {
              profile: {
                upsert: {
                  create: { image: dto.image },
                  update: { image: dto.image },
                },
              },
            }
          : {}),
      };

      if (dto.password !== undefined) {
        const saltRounds = Number(this.config.getOrThrow('app.salt'));
        data.password = await bcrypt.hash(dto.password, saltRounds);
      }

      return await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          profile: { select: { image: true } },
        },
      });
    } catch (error) {
      // Prisma error mapping
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException('User tidak ditemukan');
        }

        if (error.code === 'P2002') {
          const targets = (error.meta?.target as string[] | undefined) ?? [];

          // bikin pesan lebih enak dibaca
          if (targets.includes('email')) {
            throw new ConflictException('Email sudah digunakan oleh user lain');
          }
          if (targets.includes('username')) {
            throw new ConflictException(
              'Username sudah digunakan oleh user lain',
            );
          }

          throw new ConflictException(
            `${targets.join(', ') || 'Field'} sudah digunakan oleh user lain`,
          );
        }
      }

      throw new InternalServerErrorException('Gagal mengupdate profile');
    }
  }

  async deleteMe(req: Request, res: Response) {
    try {
      const idUser = (req.user as JwtPayload).sub;
      await this.prisma.user.delete({
        where: { id: idUser },
      });
      res.clearCookie('access_token', { path: '/' });

      return { message: 'Delete akun berhasil' };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('User tidak ditemukan');
      }
      throw error;
    }
  }
}
