import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTodoDto } from './dto/create-todo.dto';
import { QueryTodoDto } from './dto/query-todo.dto';
import { UpdateTodoDto } from './dto/update-todo.dto';

@Injectable()
export class TodoService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTodoDto: CreateTodoDto) {
    try {
      return await this.prisma.todo.create({
        data: createTodoDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        // FK constraint failed (misal userId tidak ada)
        if (error.code === 'P2003') {
          throw new NotFoundException(
            `User dengan id ${createTodoDto.userId} tidak ditemukan`,
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

  async findTodoByUserId(userId: string, query?: QueryTodoDto) {
    const sort: 'asc' | 'desc' = query?.sort ?? 'desc';
    const page = Math.max(1, query?.page ?? 1);
    const limit = Math.min(100, Math.max(1, query?.limit ?? 10));
    const skip = (page - 1) * limit;

    // 3) where condition (biar ga duplikat)
    const where = {
      userId,
      //copy semua object userId dan tambahkan status
      ...(query?.status ? { status: query.status } : {}),
    } satisfies Prisma.TodoWhereInput;

    const [user, totalData, todos] = await this.prisma.$transaction([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true },
      }),
      this.prisma.todo.count({ where }),
      this.prisma.todo.findMany({
        where,
        orderBy: { createdAt: sort },
        skip,
        take: limit,
      }),
    ]);

    if (!user) {
      throw new NotFoundException(`user dengan id ${userId} tidak ditemukan`);
    }

    return {
      page,
      limit,
      totalData,
      totalPages: Math.ceil(totalData / limit),
      sort,
      status: query?.status ?? null,
      data: todos,
    };
  }

  async update(todoId: string, userId: string, updateTodoDto: UpdateTodoDto) {
    try {
      return await this.prisma.todo.update({
        where: {
          id_userId: {
            id: todoId,
            userId: userId,
          },
        },
        data: updateTodoDto,
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'Todo tidak ditemukan atau bukan milik user',
          );
        }
        if (error.code === 'P2002') {
          throw new ConflictException('Title sudah digunakan');
        }
      }
      throw error;
    }
  }

  async remove(todoId: string, userId: string) {
    try {
      return await this.prisma.todo.delete({
        where: {
          id_userId: {
            id: todoId,
            userId: userId,
          },
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(
            'todo tidak ditemukan atau bukan milik user',
          );
        }
      }
      throw error;
    }
  }
}
