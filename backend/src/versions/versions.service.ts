import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VersionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createVersionDto: CreateVersionDto, authorId: number) {
    const { projectId, version, description, changes } = createVersionDto;

    return this.prisma.version.create({
      data: {
        projectId,
        authorId,
        version,
        description,
        changes: {
          create: changes.map((changeText) => ({ description: changeText })),
        },
      },
      include: { changes: true, author: { select: { id: true, login: true, role: true } } },
    });
  }

  async findAll() {
    return this.prisma.version.findMany({
      include: { changes: true, author: { select: { id: true, login: true, role: true } } },
    });
  }

  async findOne(id: number) {
    const version = await this.prisma.version.findUnique({
      where: { id },
      include: { changes: true, author: { select: { id: true, login: true, role: true } } }, 
    });

    if (!version) {
      throw new NotFoundException(`Версия с ID ${id} не найдена`);
    }
    return version;
  }

  async update(id: number, updateVersionDto: UpdateVersionDto) {
    await this.findOne(id); 

    const { changes, ...restData } = updateVersionDto;

    return this.prisma.version.update({
      where: { id },
      data: {
        ...restData,
        ...(changes && {
          changes: {
            deleteMany: {},
            create: changes.map((changeText) => ({ description: changeText })),
          },
        }),
      },
      include: { changes: true, author: { select: { id: true, login: true, role: true } } },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.version.delete({
      where: { id },
    });
  }
}