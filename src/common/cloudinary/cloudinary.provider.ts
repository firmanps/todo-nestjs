import { Provider } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';

export const CLOUDINARY = 'CLOUDINARY';

export const CloudinaryProvider: Provider = {
  provide: CLOUDINARY,
  inject: [ConfigService],
  useFactory: (config: ConfigService) => {
    cloudinary.config({
      cloud_name: config.getOrThrow('cloudinary.name'),
      api_key: config.getOrThrow('cloudinary.apikey'),
      api_secret: config.getOrThrow('cloudinary.apisecret'),
      secure: true,
    });
    return cloudinary;
  },
};
