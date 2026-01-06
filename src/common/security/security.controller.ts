import { Controller, Get, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CsrfService } from './csrf.service';

@Controller()
export class SecurityController {
  constructor(private readonly csrf: CsrfService) {}

  @Get('/csrf')
  getCsrf(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const csrfToken = this.csrf.generate(req, res);
    return { csrfToken };
  }
}
