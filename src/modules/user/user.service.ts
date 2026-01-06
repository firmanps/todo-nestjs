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
import { CloudinaryService } from 'src/common/cloudinary/cloudinary.service';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { JwtPayload } from '../auth/jwt-cookie/jwt-payload.type';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly cloudinary: CloudinaryService,
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

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const hasUpdate =
      dto.username !== undefined ||
      dto.email !== undefined ||
      dto.password !== undefined ||
      file !== undefined;

    if (!hasUpdate) {
      throw new BadRequestException('Tidak ada data yang akan diupdate');
    }

    // 1) Ambil data lama (buat tahu publicId lama)
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        profile: {
          select: { imagePublicId: true },
        },
      },
    });

    if (!current) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // 2) Siapkan data update
    const data: Prisma.UserUpdateInput = {
      ...(dto.username !== undefined ? { username: dto.username } : {}),
      ...(dto.email !== undefined ? { email: dto.email } : {}),
    };

    if (dto.password !== undefined) {
      const saltRounds = Number(this.config.getOrThrow('app.salt'));
      data.password = await bcrypt.hash(dto.password, saltRounds);
    }

    // 3) Jika ada file, upload dulu (biar kalau gagal, DB tidak berubah)
    let uploaded: { url: string; publicId: string } | null = null;

    if (file) {
      uploaded = await this.cloudinary.uploadAvatar(file); // ✅ assign, bukan const baru

      data.profile = {
        upsert: {
          create: { image: uploaded.url, imagePublicId: uploaded.publicId },
          update: { image: uploaded.url, imagePublicId: uploaded.publicId },
        },
      };
    }

    // 4) Update DB
    try {
      const updated = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          username: true,
          email: true,
          profile: { select: { image: true, imagePublicId: true } },
        },
      });

      // 5) Hapus gambar lama SETELAH DB sukses update
      // (kalau ini gagal, DB tetap benar — paling hanya “sampah” di Cloudinary)
      const oldPublicId = current.profile?.imagePublicId;
      if (uploaded && oldPublicId && oldPublicId !== uploaded.publicId) {
        await this.cloudinary.deleteByPublicId(oldPublicId);
      }

      return updated;
    } catch (error) {
      // Kalau DB gagal tapi sudah upload gambar baru, bersihkan gambar baru supaya tidak numpuk
      if (uploaded?.publicId) {
        await this.cloudinary
          .deleteByPublicId(uploaded.publicId)
          .catch(() => {});
      }

      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025')
          throw new NotFoundException('User tidak ditemukan');

        if (error.code === 'P2002') {
          const targets = (error.meta?.target as string[] | undefined) ?? [];
          if (targets.includes('email')) {
            throw new ConflictException('Email sudah digunakan oleh user lain');
          }
          if (targets.includes('username')) {
            throw new ConflictException(
              'Username sudah digunakan oleh user lain',
            );
          }
          throw new ConflictException('Data sudah digunakan oleh user lain');
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
