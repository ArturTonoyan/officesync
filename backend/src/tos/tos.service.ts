import { InjectModel } from '@nestjs/sequelize';
import { To } from './tos.model';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { FilesService } from 'src/files/files.service';
import { CreateTosDto } from './dto/create-tos-dto';

@Injectable()
export class TosService {
  constructor(
    @InjectModel(To) private toRepository: typeof To,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateTosDto, image: Express.Multer.File) {
    try {
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }

      const to = await this.toRepository.create(dto);
      return to;
    } catch (error) {
      console.error('Ошибка при создании то:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAll(companyId: string) {
    try {
      const tos = await this.toRepository.findAll({
        where: { companyId },
        include: { all: true },
      });
      return tos;
    } catch (error) {
      console.error('Ошибка при получении то:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getById(id: string) {
    try {
      const to = await this.toRepository.findOne({ where: { id } });
      return to;
    } catch (error) {
      console.error('Ошибка при получении то:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, dto: CreateTosDto, image: Express.Multer.File) {
    try {
      const to = await this.toRepository.findOne({ where: { id } });
      if (!to) {
        throw new Error('Неполадка не найден');
      }
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      Object.assign(to, dto);
      await to.save();
      return to;
    } catch (error) {
      console.error('Ошибка при обновлении то:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: string) {
    try {
      const to = await this.toRepository.findOne({ where: { id } });
      if (!to) {
        throw new Error('Неполадка не найден');
      }
      await to.destroy();
      return to;
    } catch (error) {
      console.error('Ошибка при удалении то:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
