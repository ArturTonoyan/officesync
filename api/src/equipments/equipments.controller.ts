import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Req,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment-dto';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('equipments')
export class EquipmentsController {
  constructor(private equipmentsService: EquipmentsService) {}

  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateEquipmentDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.equipmentsService.create(dto, image);
  }

  @Roles('ADMIN') //! ограничение по ролям
  @Get('/all/:id')
  getAllByCompanyId(@Param('id') id: string) {
    return this.equipmentsService.getAllByCompany(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image')) // Используем FileInterceptor для обработки файла
  async update(
    @Param('id') id: string,
    @Body() dto: CreateEquipmentDto,
    @UploadedFile() image: Express.Multer.File, // Получаем файл изображения
  ) {
    return this.equipmentsService.update(id, dto, image); // Обновление пользователя
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.equipmentsService.delete(id);
  }
}
