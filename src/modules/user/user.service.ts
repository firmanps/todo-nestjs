import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Request, Response } from 'express';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtPayload } from './type/jwt-payload.type';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async getMe(req: Request) {
    return await {
      user: req.user,
    };
  }

  async updateProfile(req: Request, updateProfileDto: UpdateProfileDto) {
    try {
      const userId = (req.user as JwtPayload).sub;

      // Validasi apakah ada data yang akan diupdate
      const hasDataToUpdate =
        updateProfileDto.username ||
        updateProfileDto.email ||
        updateProfileDto.password ||
        updateProfileDto.image;

      if (!hasDataToUpdate) {
        throw new BadRequestException('Tidak ada data yang akan diupdate');
      }

      // Cek apakah email sudah digunakan oleh user lain
      if (updateProfileDto.email) {
        const existingUserByEmail = await this.prisma.user.findFirst({
          where: {
            email: updateProfileDto.email,
            NOT: { id: userId },
          },
        });

        if (existingUserByEmail) {
          throw new ConflictException('Email sudah digunakan oleh user lain');
        }
      }

      // Cek apakah username sudah digunakan oleh user lain
      if (updateProfileDto.username) {
        const existingUserByUsername = await this.prisma.user.findFirst({
          where: {
            username: updateProfileDto.username,
            NOT: { id: userId },
          },
        });

        if (existingUserByUsername) {
          throw new ConflictException(
            'Username sudah digunakan oleh user lain',
          );
        }
      }

      // Prepare data untuk update
      const data: Prisma.UserUpdateInput = {};

      if (updateProfileDto.username) {
        data.username = updateProfileDto.username;
      }

      if (updateProfileDto.email) {
        data.email = updateProfileDto.email;
      }

      // Hash password jika ada
      if (updateProfileDto.password) {
        const saltRounds = 10; // atau ambil dari config/env
        data.password = await bcrypt.hash(
          updateProfileDto.password,
          saltRounds,
        );
      }

      // Update user dengan profile image (jika ada)
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: {
          ...data,
          profile: updateProfileDto.image
            ? {
                upsert: {
                  create: { image: updateProfileDto.image },
                  update: { image: updateProfileDto.image },
                },
              }
            : undefined,
        },
        select: {
          id: true,
          username: true,
          email: true,
          profile: {
            select: {
              image: true,
            },
          },
        },
      });

      return user;
    } catch (error) {
      // Handle Prisma specific errors
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // User tidak ditemukan
        if (error.code === 'P2025') {
          throw new NotFoundException('User tidak ditemukan');
        }

        // Unique constraint violation
        if (error.code === 'P2002') {
          const field = (error.meta?.target as string[])?.join(', ') || 'field';
          throw new ConflictException(
            `${field} sudah digunakan oleh user lain`,
          );
        }
      }

      // Re-throw jika sudah HTTP exception dari NestJS
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Generic error untuk unexpected errors
      throw new Error('Gagal mengupdate profile');
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
