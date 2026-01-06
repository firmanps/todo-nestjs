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
    // 1) validate input
    const hasUpdate =
      Boolean(dto.username ?? dto.email ?? dto.password) || Boolean(file);
    if (!hasUpdate)
      throw new BadRequestException('Tidak ada data yang akan diupdate');

    // 2) load current state (for old publicId)
    const current = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { profile: { select: { imagePublicId: true } } },
    });
    if (!current) throw new NotFoundException('User tidak ditemukan');

    const oldPublicId = current.profile?.imagePublicId;

    // 3) build update data
    const data: Prisma.UserUpdateInput = {};
    if (dto.username !== undefined) data.username = dto.username;
    if (dto.email !== undefined) data.email = dto.email;

    if (dto.password !== undefined) {
      const saltRounds = Number(this.config.getOrThrow('app.salt'));
      data.password = await bcrypt.hash(dto.password, saltRounds);
    }

    // 4) upload new avatar (optional)
    let uploaded: { url: string; publicId: string } | null = null;

    if (file) {
      uploaded = await this.cloudinary.uploadAvatar(file);

      data.profile = {
        upsert: {
          create: { image: uploaded.url, imagePublicId: uploaded.publicId },
          update: { image: uploaded.url, imagePublicId: uploaded.publicId },
        },
      };
    }

    // 5) persist + cleanup
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

      // delete old (avoid deleting default / shared asset)
      if (
        uploaded &&
        this.shouldDeleteOldAvatar(oldPublicId, uploaded.publicId)
      ) {
        await this.cloudinary.deleteByPublicId(oldPublicId!);
      }

      return updated;
    } catch (error) {
      // if DB update fails but upload succeeded => cleanup new uploaded file
      if (uploaded?.publicId) {
        await this.cloudinary
          .deleteByPublicId(uploaded.publicId)
          .catch(() => {});
      }

      throw this.mapPrismaOrThrow(error);
    }
  }

  private shouldDeleteOldAvatar(
    oldPublicId: string | null | undefined,
    newPublicId: string,
  ) {
    if (!oldPublicId) return false;
    if (oldPublicId === newPublicId) return false;

    // ✅ penting: jangan hapus default avatar yang dipakai banyak user
    const DEFAULT_PUBLIC_IDS = new Set(['avatars/default']);
    if (DEFAULT_PUBLIC_IDS.has(oldPublicId)) return false;

    return true;
  }

  private mapPrismaOrThrow(error: unknown): never {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2025')
        throw new NotFoundException('User tidak ditemukan');

      if (error.code === 'P2002') {
        const targets = (error.meta?.target as string[] | undefined) ?? [];
        if (targets.includes('email'))
          throw new ConflictException('Email sudah digunakan oleh user lain');
        if (targets.includes('username'))
          throw new ConflictException(
            'Username sudah digunakan oleh user lain',
          );
        throw new ConflictException('Data sudah digunakan oleh user lain');
      }
    }

    throw new InternalServerErrorException('Gagal mengupdate profile');
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
