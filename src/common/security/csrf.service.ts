import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { doubleCsrf } from 'csrf-csrf';
import type { Request, RequestHandler, Response } from 'express';

@Injectable()
export class CsrfService {
  private readonly utils: ReturnType<typeof doubleCsrf>;

  constructor(private readonly config: ConfigService) {
    const isProd = this.config.get('app.env') === 'production';
    const csrfSecret = this.config.getOrThrow<string>('csrf.secret');

    this.utils = doubleCsrf({
      getSecret: () => csrfSecret,

      // WAJIB di v4.x (return string yang stabil)
      getSessionIdentifier: (req: Request) =>
        req.cookies?.anon_id ?? req.cookies?.access_token ?? 'anon',

      cookieName: 'csrf_token',
      cookieOptions: {
        httpOnly: true,
        secure: isProd,
        sameSite: isProd ? 'none' : 'lax',
        path: '/',
      },

      // OPTIONAL tapi bagus: pastikan /csrf gak pernah dicek
      skipCsrfProtection: (req) =>
        req.method === 'GET' && req.path === '/api/v1/csrf',
    });
  }

  protection(): RequestHandler {
    return this.utils.doubleCsrfProtection;
  }

  // ✅ INI YANG BENAR untuk bikin token
  generate(req: Request, res: Response): string {
    return this.utils.generateCsrfToken(req, res);
  }
}
