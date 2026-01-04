import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiCreatedResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-cookie/jwt.guard';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
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
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(createTodoDto);
  }

  @Get('/test')
  getTest() {
    return { message: 'test' };
  }

  @HttpCode(HttpStatus.OK)
  @Get('/:userId')
  findTodoByUserId(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query() query: QueryTodoDto,
  ) {
    return this.todoService.findTodoByUserId(userId, query);
  }

  @HttpCode(HttpStatus.OK)
  @Patch('/:todoId/user/:userId')
  update(
    @Param('todoId', new ParseUUIDPipe()) todoId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todoService.update(todoId, userId, updateTodoDto);
  }

  @HttpCode(HttpStatus.OK)
  @Delete('/:todoId/user/:userId')
  remove(
    @Param('todoId', new ParseUUIDPipe()) todoId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.todoService.remove(todoId, userId);
  }
}
