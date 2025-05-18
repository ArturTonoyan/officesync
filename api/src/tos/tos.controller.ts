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
import { TosService } from './tos.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateTosDto } from './dto/create-tos-dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('tos')
export class TosController {
  constructor(private tosService: TosService) {}

  @Post('')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateTosDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.tosService.create(dto, image);
  }

  @Get('/all/:id')
  @UseGuards(JwtAuthGuard)
  get(@Param('id') companyId: string) {
    return this.tosService.getAll(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string) {
    return this.tosService.getById(id);
  }

  @Roles('ADMIN')
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Body() dto: CreateTosDto,
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.tosService.update(id, dto, image);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.tosService.delete(id);
  }
}
