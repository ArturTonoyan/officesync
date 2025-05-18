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
import { ProblemsService } from './problems.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor } from '@nestjs/platform-express';
import { CreateProblemsDto } from './dto/create-problems-dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@Controller('problems')
export class ProblemsController {
  constructor(private problemsService: ProblemsService) {}

  @Post('')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateProblemsDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.problemsService.create(dto, image);
  }

  @Get('/all/:id')
  @UseGuards(JwtAuthGuard)
  get(@Param('id') companyId: string) {
    return this.problemsService.getAll(companyId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  getById(@Param('id') id: string) {
    return this.problemsService.getById(id);
  }

  @Roles('ADMIN')
  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Body() dto: CreateProblemsDto,
    @Param('id') id: string,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.problemsService.update(id, dto, image);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  delete(@Param('id') id: string) {
    return this.problemsService.delete(id);
  }
}
