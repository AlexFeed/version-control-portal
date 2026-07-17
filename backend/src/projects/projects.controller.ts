import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, Request } from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Roles(Role.ADMIN)
  @Post()
  create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }

  @Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
  @Get()
  findAll(@Request() req) {
    return this.projectsService.findAll(req.user);
  }

  @Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.projectsService.findOne(id, req.user);
  }

  @Roles(Role.ADMIN)
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() updateProjectDto: UpdateProjectDto, @Request() req) {
    return this.projectsService.update(id, updateProjectDto, req.user);
  }

  @Roles(Role.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.projectsService.remove(id, req.user);
  }

  @Roles(Role.ADMIN, Role.DEVELOPER, Role.VIEWER)
  @Get(':id/members')
  getMembers(@Param('id', ParseIntPipe) id: number, @Request() req) {
    return this.projectsService.getMembers(id, req.user);
  }

  @Roles(Role.ADMIN)
  @Post(':id/members')
  updateMembers(@Param('id', ParseIntPipe) id: number, @Body() body: { userIds: number[] }) {
    return this.projectsService.updateMembers(id, body.userIds);
  }
}