import { RequestMethod, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AppModule } from './app.module';
import { SwaggerSetup } from './common/swagger/swagger.setup';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
  app.useLogger(logger);

  // ambil config dari ConfigService (hasil dari configuration.ts)
  const configService = app.get(ConfigService);
  const port = configService.getOrThrow('app.port') ?? 3000;
  const origin = configService.getOrThrow('app.origin');

  app.use(cookieParser());

  app.enableCors({
    origin: origin,
    credentials: true,
  });

  app.setGlobalPrefix('/api/v1', {
    exclude: [{ path: '/', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // buang field yang tidak ada di DTO
      forbidNonWhitelisted: true, // kalau ada field aneh => 400
      transform: true, // aktifkan class-transformer
      transformOptions: { enableImplicitConversion: false },
    }),
  );

  SwaggerSetup.setup(app);
  await app.listen(port);
  logger.log(`server running on port ${port}`);
}
bootstrap();
