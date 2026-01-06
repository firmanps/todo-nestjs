import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { LoggingModule } from './common/logging/logging.module';
import { PrismaModule } from './common/prisma/prisma.module';
import { PrismaService } from './common/prisma/prisma.service';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { TodoModule } from './modules/todo/todo.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [
    //manggil env itu harus dari service bagusnya
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    LoggingModule,
    PrismaModule,
    TodoModule,
    AuthModule,
    UserModule,
    CloudinaryModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService],
})
export class AppModule {}
