import { Module } from '@nestjs/common';
import { CloudinaryModule } from 'src/common/cloudinary/cloudinary.module';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule, CloudinaryModule],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard],
})
export class UserModule {}
