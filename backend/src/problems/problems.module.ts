import { forwardRef, Module } from '@nestjs/common';
import { ProblemsService } from './problems.service';
import { ProblemsController } from './problems.controller';
import { Company } from 'src/companies/companies.model';
import { User } from 'src/users/users.model';
import { Problem } from './problems.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { Floors } from 'src/floors/floors.model';
import { Equipment } from 'src/equipments/equipments.model';

@Module({
  providers: [ProblemsService],
  controllers: [ProblemsController],
  imports: [
    SequelizeModule.forFeature([Problem, Company, User, Floors, Equipment]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [ProblemsService],
})
export class ProblemsModule {}
