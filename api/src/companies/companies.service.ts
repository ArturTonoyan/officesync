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
      if (user.companyId) {
        throw new Error('У вас уже есть компания');
      }

      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      const company = await this.companyRepository.create(dto);
      //! у пользователя обновляем companyId
      const updUser = await User.findByPk(user.id);
      updUser.companyId = company.id;
      await updUser.save();
      return company;
    } catch (error) {
      console.error('Ошибка при сохранении компании:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getOneByUserId(companyId: string) {
    try {
      if (!companyId) return null;
      const company = await this.companyRepository.findOne({
        where: { id: companyId },
      });
      return company;
    } catch (error) {
      console.error('Ошибка при получении компании:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getById(id: string) {
    try {
      const company = await this.companyRepository.findOne({
        where: { id },
      });
      return company;
    } catch (error) {
      console.error('Ошибка при получении компании:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, dto: CreateCompanyDto, image: Express.Multer.File) {
    try {
      const company = await this.companyRepository.findOne({
        where: { id },
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
