import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Setting } from './entities/setting.entity';
import { DictionaryEntry } from './entities/dictionary-entry.entity';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { ActivityLogModule } from '../activity-logs/activity-log.module';

@Module({
  imports: [TypeOrmModule.forFeature([Setting, DictionaryEntry]), ActivityLogModule],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}