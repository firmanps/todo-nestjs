import { Controller, Get, Req } from '@nestjs/common';
import type { Request } from 'express';

@Controller()
export class SecurityController {
  @Get('/csrf')
  getCsrf(@Req() req: Request) {
    return { csrfToken: (req as any).csrfToken() };
  }
}
