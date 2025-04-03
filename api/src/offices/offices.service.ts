import { InjectModel } from '@nestjs/sequelize';
import { Office } from './offices.model';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { CreateOfficesDto } from './dto/create-offices-dto';
import { User } from 'src/users/users.model';
import { Company } from 'src/companies/companies.model';
import { UpdateOfficesDto } from './dto/update-offices-dto';

@Injectable()
export class OfficesService {
  constructor(
    @InjectModel(Office) private officeRepository: typeof Office,
    private rolesService: RolesService,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateOfficesDto, id: string, image: Express.Multer.File) {
    try {
      dto.companyId = id;
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      const office = await this.officeRepository.create(dto);
      return office;
    } catch (error) {
      console.error('Ошибка при создании офиса:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAll(companyId: string) {
    try {
      const offices = await this.officeRepository.findAll({
        where: { companyId },
      });
      return offices;
    } catch (error) {
      console.error('Ошибка при получении офисов:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getById(id: string) {
    try {
      const office = await this.officeRepository.findOne({ where: { id } });
      return office;
    } catch (error) {
      console.error('Ошибка при получении офиса:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, dto: UpdateOfficesDto, image: Express.Multer.File) {
    try {
      const office = await this.officeRepository.findOne({ where: { id } });
      if (!office) {
        throw new Error('Офис не найден');
      }
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      Object.assign(office, dto);
      await office.save();
      return office;
    } catch (error) {
      console.error('Ошибка при обновлении офиса:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: string) {
    try {
      const office = await this.officeRepository.findOne({ where: { id } });
      if (!office) {
        throw new Error('Офис не найден');
      }
      await office.destroy();
      return office;
    } catch (error) {
      console.error('Ошибка при удалении офиса:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
