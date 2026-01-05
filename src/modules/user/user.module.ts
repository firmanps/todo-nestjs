import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { JwtAuthGuard } from '../auth/jwt-cookie/jwt.guard';
import { UserController } from './user.controller';
import { UserService } from './user.service';

@Module({
  imports: [PrismaModule],
  controllers: [UserController],
  providers: [UserService, JwtAuthGuard],
})
export class UserModule {}
