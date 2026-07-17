import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { PrismaService } from '../prisma/prisma.service';
import { Role } from '@prisma/client';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createProjectDto: CreateProjectDto) {
    return this.prisma.project.create({
      data: createProjectDto,
    });
  }

  async findAll(user: { userId: number; role: Role }) {
    if (user.role === Role.ADMIN) {
      return this.prisma.project.findMany({
        include: { _count: { select: { versions: true } } },
      });
    }

    return this.prisma.project.findMany({
      where: {
        members: {
          some: { userId: user.userId },
        },
      },
      include: { _count: { select: { versions: true } } },
    });
  }

  async findOne(id: number, user: { userId: number; role: Role }) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        versions: {
          orderBy: { createdAt: 'desc' },
        },
        members: true,
      },
    });

    if (!project) {
      throw new NotFoundException(`Проект с ID ${id} не найден`);
    }

    if (user.role !== Role.ADMIN) {
      const isMember = project.members.some(m => m.userId === user.userId);
      if (!isMember) {
        throw new ForbiddenException('У вас нет доступа к этому проекту');
      }
    }

    return project;
  }

  async update(id: number, updateProjectDto: UpdateProjectDto, user: { userId: number; role: Role }) {
    await this.findOne(id, user); 

    return this.prisma.project.update({
      where: { id },
      data: updateProjectDto,
    });
  }

  async remove(id: number, user: { userId: number; role: Role }) {
    await this.findOne(id, user); 

    return this.prisma.project.delete({
      where: { id },
    });
  }

  async getMembers(id: number, user: { userId: number; role: Role }) {
    await this.findOne(id, user); // check access
    
    const explicitMembers = await this.prisma.memberProject.findMany({
      where: { projectId: id },
      include: {
        user: {
          select: { id: true, login: true, role: true, avatarUrl: true },
        },
      },
    });

    const versionAuthors = await this.prisma.user.findMany({
      where: {
        versions: {
          some: { projectId: id }
        }
      },
      select: { id: true, login: true, role: true, avatarUrl: true },
    });

    const allUsersMap = new Map();
    for (const m of explicitMembers) {
      allUsersMap.set(m.user.id, m.user);
    }
    for (const u of versionAuthors) {
      allUsersMap.set(u.id, u);
    }

    return Array.from(allUsersMap.values());
  }

  async updateMembers(id: number, userIds: number[]) {
    // We assume caller is ADMIN (checked in controller)
    
    // First, delete all current members
    await this.prisma.memberProject.deleteMany({
      where: { projectId: id },
    });

    // Then, insert new members
    if (userIds && userIds.length > 0) {
      const data = userIds.map(userId => ({
        projectId: id,
        userId: userId,
      }));
      await this.prisma.memberProject.createMany({
        data,
      });
    }

    return { message: 'Участники обновлены успешно' };
  }
}

