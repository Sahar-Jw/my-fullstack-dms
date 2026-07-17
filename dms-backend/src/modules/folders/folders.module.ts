import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Folder } from './entities/folder.entity';
import { FoldersService } from './folders.service';
import { FoldersController } from './folders.controller';
import { ActivityLogModule } from '../activity-logs/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Folder]),ActivityLogModule],
  providers: [FoldersService],
  controllers: [FoldersController],
  exports: [FoldersService],
})
export class FoldersModule {}
