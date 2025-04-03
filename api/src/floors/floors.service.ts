import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { User } from 'src/users/users.model';
import { Floors } from './floors.model';
import { CreateFloorsDto } from './dto/create-floors-dto';
import { UpdateFloorsDto } from './dto/update-floors-dto';
import { Office } from 'src/offices/offices.model';

@Injectable()
export class FloorsService {
  constructor(
    @InjectModel(Floors) private floorsRepository: typeof Floors,
    private rolesService: RolesService,
  ) {}

  async create(dto: CreateFloorsDto) {
    console.log('dto', dto);
    try {
      const myOffice = await Office.findByPk(dto.officeId);
      if (!myOffice) {
        throw new Error('Офис не найден');
      }
      return await this.floorsRepository.create(dto);
    } catch (error) {
      console.error('Ошибка при создании этажа:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getOne(id: string) {
    try {
      const floor = await this.floorsRepository.findOne({
        where: { id },
      });
      return floor;
    } catch (error) {
      console.error('Ошибка при получении этажа:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAllByCompanyId(id: string) {
    try {
      const floors = await this.floorsRepository.findAll({
        where: { companyId: id },
      });
      return floors;
    } catch (error) {
      console.error('Ошибка при получении этажей:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(dto: UpdateFloorsDto, id: string) {
    try {
      const floor = await this.floorsRepository.findOne({
        where: { id },
      });
      if (!floor) {
        throw new Error('Этаж не найден');
      }
      Object.assign(dto);
      await floor.save();
      return floor;
    } catch (error) {
      console.error('Ошибка при обновлении этажа:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: string) {
    try {
      const floor = await this.floorsRepository.findOne({ where: { id } });
      if (!floor) {
        throw new Error('Этаж не найден');
      }
      await floor.destroy();
      return floor;
    } catch (error) {
      console.error('Ошибка при удалении этажа:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
