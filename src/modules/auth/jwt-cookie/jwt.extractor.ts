import type { Request } from 'express';

export function cookieJwtExtractor(req: Request): string | null {
  const token = req?.cookies?.access_token;
  // console.log(token)
  return token ?? null;
}
