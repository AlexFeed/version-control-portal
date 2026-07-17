import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const { login, password, role } = createUserDto;
    
    const existingUser = await this.prisma.user.findUnique({ where: { login } });
    if (existingUser) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await this.prisma.user.create({
      data: { 
        login, 
        password: hashedPassword, 
        role: role || Role.VIEWER 
      },
    });

    const { password: _, ...result } = user;
    return result;
  }

  async findAll() {
    const users = await this.prisma.user.findMany();
    return users.map(user => {
      const { password, ...result } = user;
      return result;
    });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }
    const { password, ...result } = user;
    return result;
  }

  async findProjects(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        memberProjects: {
          include: {
            project: true,
          },
        },
        versions: {
          include: {
            project: true,
          }
        }
      },
    });

    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    const projectsMap = new Map();
    for (const mp of user.memberProjects) {
      projectsMap.set(mp.project.id, { ...mp.project });
    }
    for (const v of user.versions) {
      if (!projectsMap.has(v.project.id)) {
        projectsMap.set(v.project.id, { ...v.project, addedAt: v.createdAt });
      } else {
        const existing = projectsMap.get(v.project.id);
        if (existing.addedAt && new Date(v.createdAt) < new Date(existing.addedAt)) {
          existing.addedAt = v.createdAt;
        } else if (!existing.addedAt) {
          existing.addedAt = v.createdAt;
        }
      }
    }

    return Array.from(projectsMap.values());
  }

  async update(id: number, updateUserDto: UpdateUserDto, currentUser?: any) {
    const { role, login, password } = updateUserDto;

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    if (currentUser && role !== undefined && role !== user.role) {
      if (currentUser.userId === id) {
        throw new ForbiddenException('Вы не можете изменить собственную роль');
      }
      if (user.role === Role.ADMIN) {
        throw new ForbiddenException('Вы не можете изменять роли других администраторов');
      }
    }

    if (login && login !== user.login) {
      const existingUser = await this.prisma.user.findUnique({ where: { login } });
      if (existingUser) {
        throw new ConflictException('Пользователь с таким логином уже существует');
      }
    }

    let hashedPassword: string | undefined = undefined;
    if (password) {
      hashedPassword = await bcrypt.hash(password, 10);
    }

    const dataToUpdate: any = {};
    if (role !== undefined) dataToUpdate.role = role;
    if (login !== undefined) dataToUpdate.login = login;
    if (hashedPassword !== undefined) dataToUpdate.password = hashedPassword;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: dataToUpdate,
    });

    const { password: _, ...result } = updatedUser;
    return result;
  }

  async updateAvatar(id: number, avatarUrl: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { avatarUrl },
    });

    const { password, ...result } = updatedUser;
    return result;
  }

  async remove(id: number) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException(`Пользователь #${id} не найден`);
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: `Пользователь #${id} успешно удален` };
  }
}