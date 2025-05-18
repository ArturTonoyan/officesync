import { forwardRef, Module } from '@nestjs/common';
import { TosService } from './tos.service';
import { TosController } from './tos.controller';
import { Company } from 'src/companies/companies.model';
import { User } from 'src/users/users.model';
import { To } from './tos.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { Floors } from 'src/floors/floors.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Problem } from 'src/problems/problems.model';

@Module({
  providers: [TosService],
  controllers: [TosController],
  imports: [
    SequelizeModule.forFeature([To, Company, User, Floors, Equipment, Problem]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [TosService],
})
export class TosModule {}
