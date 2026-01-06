import { Module } from '@nestjs/common';
import { CsrfService } from './csrf.service';
import { SecurityController } from './security.controller';

@Module({
  controllers: [SecurityController],
  providers: [CsrfService],
  exports: [CsrfService],
})
export class SecurityModule {}
