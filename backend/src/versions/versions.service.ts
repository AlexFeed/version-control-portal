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
      include: { changes: true },
    });
  }

  async findAll() {
    return this.prisma.version.findMany({
      include: { changes: true },
    });
  }

  async findOne(id: number) {
    const version = await this.prisma.version.findUnique({
      where: { id },
      include: { changes: true }, // Обязательно подтягиваем список изменений для карточки
    });

    if (!version) {
      throw new NotFoundException(`Версия с ID ${id} не найдена`);
    }
    return version;
  }

  async update(id: number, updateVersionDto: UpdateVersionDto) {
    await this.findOne(id); // Сначала проверяем, существует ли версия

    const { changes, ...restData } = updateVersionDto;

    return this.prisma.version.update({
      where: { id },
      data: {
        ...restData,
        // Если клиент прислал новый массив изменений, мы удаляем все старые и записываем новые
        ...(changes && {
          changes: {
            deleteMany: {},
            create: changes.map((changeText) => ({ description: changeText })),
          },
        }),
      },
      include: { changes: true },
    });
  }

  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.version.delete({
      where: { id },
    });
  }
}