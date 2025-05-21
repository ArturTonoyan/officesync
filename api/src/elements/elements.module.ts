import { forwardRef, Module } from '@nestjs/common';
import { ElementsService } from './elements.service';
import { ElementsController } from './elements.controller';
import { Floors } from 'src/floors/floors.model';
import { SequelizeModule } from '@nestjs/sequelize';
import { Equipment } from 'src/equipments/equipments.model';
import { RolesModule } from 'src/roles/roles.module';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';
import { Element } from './elements.model';
import { ElementsReserved } from './elements-reserved.model';
import { User } from 'src/users/users.model';

@Module({
  providers: [ElementsService],
  controllers: [ElementsController],
  imports: [
    SequelizeModule.forFeature([
      Floors,
      Equipment,
      Element,
      ElementsReserved,
      User,
    ]),
    RolesModule,
    forwardRef(() => AuthModule),
    FilesModule,
  ],
  exports: [ElementsService],
})
export class ElementsModule {}
