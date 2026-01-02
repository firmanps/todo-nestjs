import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';
import { TodoService } from './todo.service';

@Controller('/todo')
export class TodoController {
  constructor(private readonly todoService: TodoService) {}

  @Post()
  create(@Body() createTodoDto: CreateTodoDto) {
    return this.todoService.create(createTodoDto);
  }

  @Get('/:userId')
  findTodoByUserId(
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Query() query: QueryTodoDto,
  ) {
    return this.todoService.findTodoByUserId(userId, query);
  }

  @Patch('/:todoId/user/:userId')
  update(
    @Param('todoId', new ParseUUIDPipe()) todoId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
    @Body() updateTodoDto: UpdateTodoDto,
  ) {
    return this.todoService.update(todoId, userId, updateTodoDto);
  }

  @Delete('/:todoId/user/userId')
  remove(
    @Param('todoId', new ParseUUIDPipe()) todoId: string,
    @Param('userId', new ParseUUIDPipe()) userId: string,
  ) {
    return this.todoService.remove(todoId, userId);
  }
}
