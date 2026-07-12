import { Module } from '@nestjs/common';
import { VersionsService } from './versions.service';
import { VersionsController } from './versions.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [VersionsController],
  providers: [VersionsService, PrismaService],
})
export class VersionsModule {}
