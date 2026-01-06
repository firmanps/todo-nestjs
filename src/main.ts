import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { randomUUID } from 'crypto';
import helmet from 'helmet';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { CsrfService } from './common/security/csrf.service';
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

  // anon_id cookie (unik per browser)
  app.use((req, res, next) => {
    if (!req.cookies?.anon_id) {
      res.cookie('anon_id', randomUUID(), {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      });
    }
    next();
  });

  // CORS
  app.enableCors({
    origin,
    credentials: true,
  });

  // CSRF
  const csrfService = app.get(CsrfService);
  app.use(csrfService.protection());

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
