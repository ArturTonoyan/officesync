import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Company } from './companies.model';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { CreateCompanyDto } from './dto/create-company-dto';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company) private companyRepository: typeof Company,
    private rolesService: RolesService,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateCompanyDto) {
    const company = await this.companyRepository.create(dto);
    return company;
  }
}
