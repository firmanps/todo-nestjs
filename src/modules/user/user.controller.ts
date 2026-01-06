import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request, Response } from 'express';
import { extname } from 'path';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { JwtPayload } from '../auth/jwt-cookie/jwt-payload.type';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserService } from './user.service';

@UseGuards(JwtAuthGuard)
@Controller('/user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  @Get('/me')
  Me(@Req() req: Request) {
    const userId = (req.user as JwtPayload).sub;
    return this.userService.getMe(userId);
  }

  @Patch('/updateprofile')
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
      fileFilter: (req, image, cb) => {
        // 1️⃣ cek MIME type (utama)
        const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];

        if (!allowedMimeTypes.includes(image.mimetype)) {
          cb(
            new BadRequestException('Format gambar harus JPG, PNG, atau WEBP'),
            false,
          );
          return;
        }

        // 2️⃣ cek extension (tambahan pengaman)
        const allowedExt = ['.jpg', '.jpeg', '.png', '.webp'];
        const ext = extname(image.originalname).toLowerCase();

        if (!allowedExt.includes(ext)) {
          cb(
            new BadRequestException('Ekstensi file harus JPG, PNG, atau WEBP'),
            false,
          );
          return;
        }

        // 3️⃣ lolos semua validasi
        cb(null, true);
      },
    }),
  )
  updateProfile(
    @Req() req: Request,
    @Body() updateProfileDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = (req.user as JwtPayload).sub;
    return this.userService.updateProfile(userId, updateProfileDto, file);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/deleteme')
  async deleteMe(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.userService.deleteMe(req, res);
  }
}
