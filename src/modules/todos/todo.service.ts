import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, createTodoDto: CreateTodoDto) {
    try {
      return await this.prisma.todo.create({
        data: {
          title: createTodoDto.title,
          status: createTodoDto.status,
          description: createTodoDto.description,
          userId: userId,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // FK constraint failed (misal userId tidak ada)
        if (error.code === 'P2003') {
          throw new NotFoundException(
            `User dengan id ${userId} tidak ditemukan`,
          );
        }
        // unique constraint
        if (error.code === 'P2002') {
          throw new ConflictException(`Title sudah digunakan`);
        }
      }
      throw error;
    }
  }

  async getTodo(userId: string, query: QueryTodoDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;
  
    // optional: rapihin search (trim) + minimal 2 char biar ga spam
    const search = (query.search ?? "").trim();
    const hasSearch = search.length >= 2;
  
    const where = {
      userId,
      ...(query.status ? { status: query.status } : {}),
      ...(hasSearch
        ? {
            title: {
              contains: search,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };
  
    const orderBy = {
      createdAt: query.sort === "asc" ? ("asc" as const) : ("desc" as const),
    };
  
    const [data, totalData] = await Promise.all([
      this.prisma.todo.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.todo.count({ where }),
    ]);
  
    const totalPage = Math.ceil(totalData / limit);
  
    return {
      meta: {
        page,
        limit,
        totalData,
        totalPage,
        sort: query.sort ?? "desc",
        status: query.status ?? null,
        search: hasSearch ? search : null,
      },
      data,
    };
  }
  

  async getTodoById(userId: string, todoId: string) {
    try {
      const todo = await this.prisma.todo.findFirst({
        where: {
          id: todoId,
          userId,
        },
      });

      if (!todo) {
        throw new NotFoundException(
          'Todo tidak ditemukan atau bukan milik anda',
        );
      }

      return todo;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengambil todo');
    }
  }

  async updateTodo(userId: string, todoId: string, dto: UpdateTodoDto) {
    const hasUpdate =
      dto.title !== undefined ||
      dto.status !== undefined ||
      dto.description !== undefined;

    if (!hasUpdate) {
      throw new BadRequestException('Tidak ada data yang diupdate');
    }

    try {
      const result = await this.prisma.todo.updateMany({
        where: { id: todoId, userId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title } : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description }
            : {}),
        },
      });

      if (result.count === 0) {
        throw new NotFoundException(
          'Todo tidak ditemukan atau bukan milik anda',
        );
      }

      const todo = await this.prisma.todo.findFirst({
        where: { id: todoId, userId },
      });

      if (!todo)
        throw new NotFoundException(
          'Todo tidak ditemukan atau bukan milik anda',
        );
      return todo;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002')
          throw new BadRequestException('Title sudah digunakan');
      }
      if (error instanceof Prisma.PrismaClientValidationError) {
        throw new BadRequestException(error.message);
      }
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException('Gagal mengupdate todo');
    }
  }

  async deleteTodo(userId: string, todoId: string) {
    try {
      const result = await this.prisma.todo.deleteMany({
        where: {
          id: todoId,
          userId,
        },
      });

      // Tidak ditemukan / bukan milik user
      if (result.count === 0) {
        throw new NotFoundException(
          'Todo tidak ditemukan atau bukan milik anda',
        );
      }

      return {
        message: 'Todo berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException('Gagal menghapus todo');
    }
  }
}
