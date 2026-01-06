import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import * as sharp from 'sharp';
import { CLOUDINARY } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary,
  ) {}

  private async assertRealImage(file: Express.Multer.File) {
    try {
      // ✅ kalau ini gagal, berarti bukan gambar valid
      await sharp(file.buffer, { failOn: 'none' }).metadata();
    } catch {
      throw new BadRequestException(`File bukan gambar yang valid`);
    }
  }

  private async sanitizeToWebp(file: Express.Multer.File) {
    // ✅ re-encode: buang payload aneh + buang metadata
    // ukuran dibatasi biar ga ada image raksasa (DoS)
    return sharp(file.buffer)
      .rotate() // auto-orient kalau ada EXIF
      .resize(512, 512, { fit: 'cover', withoutEnlargement: true })
      .toFormat('webp', { quality: 80 })
      .toBuffer();
  }

  async uploadAvatar(
    file: Express.Multer.File,
  ): Promise<{ url: string; publicId: string }> {
    try {
      await this.assertRealImage(file);

      const safeBuffer = await this.sanitizeToWebp(file);

      const base64 = safeBuffer.toString('base64');
      const dataUri = `data:image/webp;base64,${base64}`;

      const result = await this.cloudinary.uploader.upload(dataUri, {
        folder: 'avatars',
        resource_type: 'image',
      });

      return { url: result.secure_url, publicId: result.public_id };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      throw new InternalServerErrorException('Gagal upload gambar');
    }
  }

  async deleteByPublicId(publicId?: string) {
    if (!publicId) return;
    await this.cloudinary.uploader.destroy(publicId);
  }
}
