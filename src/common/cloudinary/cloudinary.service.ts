import { Inject, Injectable } from '@nestjs/common';
import { v2 as Cloudinary } from 'cloudinary';
import { CLOUDINARY } from './cloudinary.provider';

@Injectable()
export class CloudinaryService {
  constructor(
    @Inject(CLOUDINARY) private readonly cloudinary: typeof Cloudinary,
  ) {}

  async uploadImage(file: Express.Multer.File, folder: string) {
    const base64 = file.buffer.toString('base64');
    const dataUri = `data:${file.mimetype};base64,${base64}`;

    const result = await this.cloudinary.uploader.upload(dataUri, {
      folder,
      resource_type: 'image',
    });

    return { url: result.secure_url, publicId: result.public_id };
  }

  async deleteByPublicId(publicId?: string) {
    if (!publicId) return;
    await this.cloudinary.uploader.destroy(publicId);
  }
}
