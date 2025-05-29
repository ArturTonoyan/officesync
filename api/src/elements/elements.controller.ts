import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ElementsService } from './elements.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { CreateElementDto } from './dto/create-element-dto';
import { UpdateElementDto } from './dto/update-element-dto';
import { CreateReservedDto } from './dto/create-reserved-dto';

@Controller('elements')
export class ElementsController {
  constructor(private elementsService: ElementsService) {}

  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateElementDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.elementsService.create(dto, image);
  }

  @Roles('ADMIN')
  @Post('bulk')
  async createMany(@Body() dtos: UpdateElementDto[]) {
    return this.elementsService.createMany(dtos);
  }

  @Roles('ADMIN')
  @Get('/all/:id')
  getAllByFloorId(@Param('id') id: string) {
    return this.elementsService.getAllByFloor(id);
  }

  @Roles('ADMIN')
  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Param('id') id: string,
    @Body() dto: CreateElementDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.elementsService.update(id, dto, image);
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.elementsService.delete(id);
  }

  @Post('/reserveds')
  createReserved(@Body() dto: CreateReservedDto) {
    return this.elementsService.createReserved(dto);
  }

  @Get('/reserveds')
  getReserveds(
    @Query('date') date: string,
    @Query('elementId') elementId: string,
  ) {
    return this.elementsService.getReserveds(date, elementId);
  }

  @Get('/reserveds/:elementId')
  getReservedsElement(@Param('elementId') elementId: string) {
    return this.elementsService.getReservedsElement(elementId);
  }

  @Get('/reserveds/:userId')
  getMyReserveds(@Param('userId') userId: string) {
    return this.elementsService.getMyReserveds(userId);
  }

  @Delete('/reserveds/:id')
  deleteReserved(@Param('id') id: string) {
    return this.elementsService.deleteReserved(id);
  }
}
