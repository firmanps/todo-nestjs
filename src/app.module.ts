import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CloudinaryModule } from './common/cloudinary/cloudinary.module';
import { LoggingModule } from './common/logging/logging.module';
import { RequestLoggerMiddleware } from './common/middlewares/request-logger.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { SecurityModule } from './common/security/security.module';
import configuration from './config/configuration';
import { AuthModule } from './modules/auth/auth.module';
import { TodoModule } from './modules/todos/todo.module';
import { UserModule } from './modules/users/user.module';

@Module({
  imports: [
    //manggil env itu harus dari service bagusnya
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60_000, // 60 detik
        limit: 60, // max 60 request / menit
      },
    ]),
    LoggingModule,
    PrismaModule,
    TodoModule,
    AuthModule,
    UserModule,
    CloudinaryModule,
    SecurityModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestLoggerMiddleware)
      .exclude({ path: '/', method: RequestMethod.GET }) // optional: biar "/" ga spam log
      .forRoutes('*');
  }
}
