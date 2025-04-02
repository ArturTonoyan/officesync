import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { CreateCompanyDto } from './dto/create-company-dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Post()
  @Roles('ADMIN')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateCompanyDto,
    @Req() request: any,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const user = request.user;
    return this.companiesService.create(dto, user, image);
  }

  @Roles('ADMIN')
  @Get('/my')
  @UseGuards(JwtAuthGuard)
  getOneByUserId(@Req() request: any) {
    const companyId = request.user.companyId;
    return this.companiesService.getOneByUserId(companyId);
  }

  @Roles('ADMIN')
  @Put('/my')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('image'))
  update(
    @Body() dto: CreateCompanyDto,
    @Req() request: any,
    @UploadedFile() image: Express.Multer.File,
  ) {
    const companyId = request.user.companyId;
    return this.companiesService.update(companyId, dto, image);
  }
}
