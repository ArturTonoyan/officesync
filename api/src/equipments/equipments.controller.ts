import {
  Body,
  Controller,
  Delete,
  Get,
  Logger,
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
  private readonly logger = new Logger(EquipmentsController.name);

  constructor(private equipmentsService: EquipmentsService) {}

  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateEquipmentDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    this.logger.log(
      `Create equipment request inventoryNumber=${dto?.inventoryNumber || 'n/a'}, companyId=${dto?.companyId || 'n/a'}`,
    );
    return this.equipmentsService.create(dto, image);
  }

  @Roles('ADMIN') //! ограничение по ролям
  @Get('/all/:id')
  getAllByCompanyId(@Param('id') id: string) {
    this.logger.log(`Get equipments by company request companyId=${id}`);
    return this.equipmentsService.getAllByCompany(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image')) // Используем FileInterceptor для обработки файла
  async update(
    @Param('id') id: string,
    @Body() dto: CreateEquipmentDto,
    @UploadedFile() image: Express.Multer.File, // Получаем файл изображения
  ) {
    this.logger.log(`Update equipment request id=${id}`);
    return this.equipmentsService.update(id, dto, image); // Обновление пользователя
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    this.logger.log(`Delete equipment request id=${id}`);
    return this.equipmentsService.delete(id);
  }
}
