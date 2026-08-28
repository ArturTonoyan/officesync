import { forwardRef, Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Company } from './companies.model';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { User } from 'src/users/users.model';
import { Floors } from 'src/floors/floors.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Office } from 'src/offices/offices.model';

@Module({
  providers: [CompaniesService],
  controllers: [CompaniesController],
  imports: [
    SequelizeModule.forFeature([Company, User, Floors, Equipment, Office]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [CompaniesService],
})
export class CompaniesModule {}
