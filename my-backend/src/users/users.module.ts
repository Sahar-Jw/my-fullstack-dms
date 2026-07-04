import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) {
          throw new Error('Missing JWT_SECRET in environment');
        }

        const expiresInRaw = config.get<string>('JWT_EXPIRES_IN');
        const expiresIn: any = expiresInRaw ?? '1d';

        return {
          global: true,
          secret,
          signOptions: { expiresIn },
        };
      },
    }), ],
})
export class UsersModule {}

