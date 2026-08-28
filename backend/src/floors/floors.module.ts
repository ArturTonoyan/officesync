import { forwardRef, Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { User } from 'src/users/users.model';
import { Floors } from './floors.model';
import { FloorsService } from './floors.service';
import { FloorsController } from './floors.controller';
import { Company } from 'src/companies/companies.model';
import { Office } from 'src/offices/offices.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Element } from 'src/elements/elements.model';

@Module({
  providers: [FloorsService],
  controllers: [FloorsController],
  imports: [
    SequelizeModule.forFeature([
      Floors,
      User,
      Company,
      Office,
      Equipment,
      Element,
    ]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [FloorsService],
})
export class FloorsModule {}
