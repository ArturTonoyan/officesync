import { forwardRef, Module } from '@nestjs/common';
import { OfficesService } from './offices.service';
import { OfficesController } from './offices.controller';
import { Company } from 'src/companies/companies.model';
import { User } from 'src/users/users.model';
import { Office } from './offices.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { Floors } from 'src/floors/floors.model';
import { Equipment } from 'src/equipments/equipments.model';

@Module({
  providers: [OfficesService],
  controllers: [OfficesController],
  imports: [
    SequelizeModule.forFeature([Office, Company, User, Floors, Equipment]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [OfficesService],
})
export class OfficesModule {}
