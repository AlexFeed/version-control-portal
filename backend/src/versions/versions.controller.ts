import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { VersionsService } from './versions.service';
import { CreateVersionDto } from './dto/create-version.dto';
import { UpdateVersionDto } from './dto/update-version.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('versions')
export class VersionsController {
  constructor(private readonly versionsService: VersionsService) {}

  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Post()
  create(@Body() createVersionDto: CreateVersionDto, @Request() req) {
    // Извлекаем ID текущего авторизованного пользователя из токена
    const authorId = req.user.userId;
    return this.versionsService.create(createVersionDto, authorId);
  }

  @Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
  @Get()
  findAll() {
    return this.versionsService.findAll();
  }

  @Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.versionsService.findOne(id);
  }

  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateVersionDto: UpdateVersionDto) {
    return this.versionsService.update(id, updateVersionDto);
  }

  @Roles(Role.ADMIN, Role.DEVELOPER)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.versionsService.remove(id);
  }
}