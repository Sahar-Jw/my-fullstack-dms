import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { CategoriesModule } from './categories/categories.module';
import { DocumentsModule } from './documents/documents.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/entities/user.entity';
import { Department } from './departments/entities/department.entity';
import { Category } from './categories/entities/category.entity';
import { Attachment } from './attachments/entities/attachment.entity';
import { Document } from './documents/entities/document.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [UsersModule, DepartmentsModule, CategoriesModule, DocumentsModule, AttachmentsModule,
    TypeOrmModule.forRootAsync({
      inject:[ConfigService],
      useFactory:(configService:ConfigService)=>({
        type: 'postgres',
        database:configService.get<string>('DB_DATABASE'),
        username:configService.get<string>('DB_USERNAME'),
        password:configService.get<string>('DB_PASSWORD'),
        port:configService.get<number>('DB_PORT'),
        host:'localhost',
        synchronize:true,
        entities:[User,Department,Category,Document,Attachment]
      })
    }),
    ConfigModule.forRoot({
      isGlobal:true,
      envFilePath:`.env.development`
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
