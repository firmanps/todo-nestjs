import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../../common/guards/jwt.guard';
import { JwtPayload } from '../auth/jwt-cookie/jwt-payload.type';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { TodoService } from './todo.service';

@UseGuards(JwtAuthGuard)
@Controller('/todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  //response di swagger
  @ApiCreatedResponse({
    description: 'User berhasil dibuat',
    example: {
      id: 'uuid',
      name: 'example',
      email: 'example@mail.com',
      createdAt: '2026-01-01T10:00:00.000Z',
    },
  })
  @HttpCode(HttpStatus.CREATED)
  @Post()
  create(@Req() req: Request, @Body() createTodoDto: CreateTodoDto) {
    const userId = (req.user as JwtPayload).sub;
    return this.todoService.create(userId, createTodoDto);
  }

  @HttpCode(HttpStatus.OK)
  @Get()
  getTodo(@Req() req: Request, @Query() query: QueryTodoDto) {
    const userId = (req.user as JwtPayload).sub;
    return this.todoService.getTodo(userId, query);
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:todoId')
  async getTodoById(
    @Req() req: Request,
    @Param('todoId', new ParseUUIDPipe()) todoId: string,
  ) {
    const userId = (req.user as JwtPayload).sub;

    return this.todoService.getTodoById(userId, todoId);
  }
  @HttpCode(HttpStatus.OK)
  @Delete('/:todoId')
  deleteTodo(@Req() req: Request, @Param('todoId') todoId: string) {
    const userId = (req.user as JwtPayload).sub;
    return this.todoService.deleteTodo(userId, todoId);
  }
}
