import { forwardRef, Module } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { CompaniesController } from './companies.controller';
import { SequelizeModule } from '@nestjs/sequelize';
import { Company } from './companies.model';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  providers: [CompaniesService],
  controllers: [CompaniesController],
  imports: [
    SequelizeModule.forFeature([Company]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [CompaniesService],
})
export class CompaniesModule {}
