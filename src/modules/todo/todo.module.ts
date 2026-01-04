import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/common/prisma/prisma.module';
import { JwtAuthGuard } from '../auth/jwt-cookie/jwt.guard';
import { TodoController } from './todo.controller';
import { TodoService } from './todo.service';

@Module({
  imports: [PrismaModule],
  controllers: [TodoController],
  providers: [TodoService, JwtAuthGuard],
})
export class TodoModule {}
