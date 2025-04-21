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
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { OfficesService } from './offices.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateOfficesDto } from './dto/create-offices-dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateOfficesDto } from './dto/update-offices-dto';

@Controller('offices')
export class OfficesController {
  constructor(private officesService: OfficesService) {}

  @Post('/create/:id')
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateOfficesDto,
    @Param('id') id: string,
    @UploadedFile() contract: Express.Multer.File,
  ) {
    console.log('id', id);
    return this.officesService.create(dto, id, contract);
  }

  @Roles('ADMIN')
  @Get('/all/:id')
  @UseGuards(JwtAuthGuard)
  get(@Param('id') companyId: string) {
    return this.officesService.getAll(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string) {
    return this.officesService.getById(id);
  }

  @Roles('ADMIN')
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Body() dto: UpdateOfficesDto,
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.officesService.update(id, dto, image);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.officesService.delete(id);
  }
}
