import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Company } from './companies.model';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { CreateCompanyDto } from './dto/create-company-dto';
import { User } from 'src/users/users.model';

@Injectable()
export class CompaniesService {
  constructor(
    @InjectModel(Company) private companyRepository: typeof Company,
    private rolesService: RolesService,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateCompanyDto, user: User, image: Express.Multer.File) {
    try {
      const myCompany = await this.companyRepository.findOne({
        where: { id: user.companyId },
      });
      if (myCompany) {
        throw new Error('У вас уже есть компания');
      }
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      //! у пользователя обновляем companyId
      const updUser = await User.findByPk(user.id);
      updUser.companyId = myCompany.id;
      await updUser.save();
      const company = await this.companyRepository.create(dto);
      return company;
    } catch (error) {
      console.error('Ошибка при сохранении компании:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getOneByUserId(companyId: string) {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      return company;
    } catch (error) {
      console.error('Ошибка при получении компании:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(
    companyId: string,
    dto: CreateCompanyDto,
    image: Express.Multer.File,
  ) {
    try {
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      if (!company) {
        throw new Error('Компания не найдена');
      }
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      Object.assign(company, dto);
      await company.save();
      return company;
    } catch (error) {
      console.error('Ошибка при обновлении компании:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
