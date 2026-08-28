import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { Company } from 'src/companies/companies.model';
import { Office } from 'src/offices/offices.model';
import { Floors } from 'src/floors/floors.model';
import { User } from 'src/users/users.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Problem } from 'src/problems/problems.model';
import { To } from 'src/tos/tos.model';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  controllers: [ChatController],
  providers: [ChatService],
  imports: [
    ConfigModule,
    AuthModule,
    SequelizeModule.forFeature([
      Company,
      Office,
      Floors,
      User,
      Equipment,
      Problem,
      To,
    ]),
  ],
})
export class ChatModule {}
