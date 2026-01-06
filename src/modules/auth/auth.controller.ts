import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { CreateAuthDto } from './dto/create-auth.dto';
import { RequestLoginDto } from './dto/login-request.dto';

@Controller('/auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService,
  ) {}

  @HttpCode(HttpStatus.CREATED)
  @Post('/register')
  register(@Body() createAuthDto: CreateAuthDto) {
    return this.authService.register(createAuthDto);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async login(
    @Body() requestLoginDto: RequestLoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const accessToken = await this.authService.login(requestLoginDto);
    const env = this.config.getOrThrow('app.env');
    const isProd = env === 'production';
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: isProd, // production wajib true (HTTPS)
      sameSite: isProd ? 'none' : 'lax', // aman untuk mayoritas kasus
      domain: isProd ? this.config.getOrThrow('app.cookie_domain') : undefined,
      maxAge: 30 * 60 * 60 * 1000, // 1 hari
      path: '/', // cookie berlaku untuk semua route
    });

    return { message: 'Login Sukses' };
  }

  @HttpCode(HttpStatus.OK)
  @Post('/logout')
  logout(@Res({ passthrough: true }) res: Response) {
    return this.authService.logout(res);
  }
}
