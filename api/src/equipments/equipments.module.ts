import { forwardRef, Module } from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { EquipmentsController } from './equipments.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Floors } from 'src/floors/floors.model';
import { User } from 'src/users/users.model';
import { Equipment } from './equipments.model';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { Company } from 'src/companies/companies.model';
import { Office } from 'src/offices/offices.model';

@Module({
  providers: [EquipmentsService],
  controllers: [EquipmentsController],
  imports: [
    SequelizeModule.forFeature([Floors, User, Equipment, Company, Office]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [EquipmentsService],
})
export class EquipmentsModule {}
