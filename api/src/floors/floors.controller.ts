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
import { Roles } from 'src/auth/roles-auth-decorator';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { FloorsService } from './floors.service';
import { CreateFloorsDto } from './dto/create-floors-dto';

@Controller('floors')
export class FloorsController {
  constructor(private floorsService: FloorsService) {}

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard)
  create(@Body() dto: CreateFloorsDto, @Req() request: any) {
    const user = request.user;
    return this.floorsService.create(dto, user);
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.floorsService.getOne(id);
  }

  @Roles('ADMIN')
  @Put(':id')
  update(@Body() dto: CreateFloorsDto, @Param('id') id: string) {
    return this.floorsService.update(dto, id);
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.floorsService.delete(id);
  }
}
