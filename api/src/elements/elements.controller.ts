import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { ElementsService } from './elements.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateElementDto } from './dto/create-element-dto';

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
}
