import {
  Body,
  Controller,
  Delete,
  Get,
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

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateOfficesDto,
    @Req() request: any,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const user = request.user;
    return this.officesService.create(dto, user, image);
  }

  @Roles('ADMIN')
  @Get('/all')
  @UseGuards(JwtAuthGuard)
  get(@Req() request: any) {
    const companyId = request.user.companyId;
    return this.officesService.getAll(companyId);
  }

  @Get('/my')
  @UseGuards(JwtAuthGuard)
  getOneByUserId(@Req() request: any) {
    const officeId = request.user.officeId;
    return this.officesService.getMy(officeId);
  }

  @Roles('ADMIN')
  @Put('/my')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Body() dto: UpdateOfficesDto,
    @Req() request: any,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const officeId = request.user.officeId;
    return this.officesService.update(officeId, dto, image);
  }

  @Roles('ADMIN')
  @Delete('/my')
  @UseGuards(JwtAuthGuard)
  delete(@Req() request: any) {
    const officeId = request.user.officeId;
    return this.officesService.delete(officeId);
  }
}
