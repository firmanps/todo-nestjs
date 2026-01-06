import {
  BadRequestException,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import * as csurf from 'csurf';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { SwaggerSetup } from './common/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Helmet (security headers)
  app.use(
    helmet({
      // kalau pakai Swagger, CSP sering bikin ribet
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Logger (Winston)
  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // Config
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow('app.port') ?? 3000;
  const isProd = configService.getOrThrow('app.env') === 'production';
  const origin = configService.getOrThrow('app.origin');

  // Cookie parser
  app.use(cookieParser());

  // CORS
  app.enableCors({
    origin,
    credentials: true,
  });

  // CSRF middleware (cookie-based)
  app.use(
    csurf({
      cookie: {
        key: 'csrf_secret',
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      },
      value: (req) =>
        (req.headers['x-csrf-token'] as string) ||
        (req.headers['x-xsrf-token'] as string) ||
        '',
    }),
  );

  // CSRF error handler
  app.use((err: any, _req: any, _res: any, next: any) => {
    if (err?.code === 'EBADCSRFTOKEN') {
      return next(
        new BadRequestException('CSRF token tidak valid atau tidak ada'),
      );
    }
    return next(err);
  });

  // Global prefix
  app.setGlobalPrefix('/api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  // Swagger
  SwaggerSetup.setup(app);

  await app.listen(port);
  logger.log(`server running on port ${port}`);
}

bootstrap();
