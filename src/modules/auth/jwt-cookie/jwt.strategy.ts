import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { cookieJwtExtractor } from './jwt.extractor';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => cookieJwtExtractor(req),
      ]),

      secretOrKey: config.getOrThrow<string>('jwt.secret'),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    // payload ini nanti masuk ke req.user
    // console.log(this.config.getOrThrow<string>('jwt.secret'),)
    if (!payload?.sub) throw new UnauthorizedException('Token tidak valid');
    return payload;
  }
}
