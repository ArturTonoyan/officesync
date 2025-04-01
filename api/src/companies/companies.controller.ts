import { Body, Controller, Post } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { Roles } from 'src/auth/roles-auth-decorator';
import { CreateCompanyDto } from './dto/create-company-dto';

@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateCompanyDto) {
    return this.companiesService.create(dto);
  }
}
