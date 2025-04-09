import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { ElementsService } from './elements.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
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
  @Post('bulk')
  @UseInterceptors(
    FilesInterceptor('image', 10, {
      // Adjust the number as needed
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/\/(jpg|jpeg|png|gif|svg)$/)) {
          cb(null, true);
        } else {
          cb(new Error('Unsupported file type'), false);
        }
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB file size limit
      },
    }),
  )
  async createMany(
    @Body() dtos: CreateElementDto[],
    @UploadedFiles() icons: Express.Multer.File[],
  ) {
    return this.elementsService.createMany(dtos, icons);
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
