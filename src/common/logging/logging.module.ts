import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
@Module({
  imports: [
    WinstonModule.forRootAsync({
      imports: [ConfigModule], // supaya ConfigService siap dipakai
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const env = config.get<string>('app.env') ?? 'development';
        const appName = config.get<string>('app.name') ?? 'my-nest-app';
        const isProd = env === 'production';

        return {
          level: isProd ? 'info' : 'debug',
          transports: [
            new winston.transports.Console({
              format: isProd
                ? winston.format.combine(
                    winston.format.timestamp(),
                    winston.format.errors({ stack: true }),
                    winston.format.json(),
                  )
                : winston.format.combine(
                    winston.format.colorize(),
                    winston.format.timestamp(),
                    winston.format.printf(
                      ({ level, message, timestamp, context, ...meta }) => {
                        const rest = Object.keys(meta).length
                          ? ` ${JSON.stringify(meta)}`
                          : '';
                        return `${timestamp} [${context ?? 'App'}] ${level}: ${message}${rest}`;
                      },
                    ),
                  ),
            }),
          ],
          defaultMeta: {
            service: {appName},
          },
        };
      },
    }),
  ],
  exports: [WinstonModule],
})
export class LoggingModule {}
