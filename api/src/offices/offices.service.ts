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

  async create(
    dto: CreateOfficesDto,
    id: string,
    contract: Express.Multer.File,
  ) {
    try {
      dto.companyId = id;
      console.log('dto', dto);
      const office = await this.officeRepository.create(dto);
      if (contract) {
        const fileName = await this.fileService.createFile(contract);
        dto.contract = fileName;
      }
      if (dto.directorId) {
        const user = await User.findByPk(dto.directorId);
        if (!user) {
          throw new Error('Пользователь не найден');
        }
        const role = await this.rolesService.getRoleByValue('DIRECTOR');
        if (!role) {
          throw new Error('Роль не найдена');
        }
        user.roles = [role];
        user.officeId = office.id;
        await user.save();
      }
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
        include: { all: true },
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

  async update(
    id: string,
    dto: UpdateOfficesDto,
    contract: Express.Multer.File,
  ) {
    console.log('dto', dto);
    try {
      const office = await this.officeRepository.findOne({ where: { id } });
      if (!office) {
        throw new Error('Офис не найден');
      }
      if (contract) {
        const fileName = await this.fileService.createFile(contract);
        dto.contract = fileName;
      }
      if (dto.directorId) {
        const user = await User.findByPk(dto.directorId);
        if (!user) {
          throw new Error('Пользователь не найден');
        }
        const role = await this.rolesService.getRoleByValue('DIRECTOR');
        if (!role) {
          throw new Error('Роль не найдена');
        }
        user.roles = [role];
        user.officeId = office.id;
        await user.save();
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
