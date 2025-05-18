import { InjectModel } from '@nestjs/sequelize';
import { Problem } from './problems.model';
import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { CreateProblemsDto } from './dto/create-problems-dto';
import { User } from 'src/users/users.model';

@Injectable()
export class ProblemsService {
  constructor(
    @InjectModel(Problem) private problemRepository: typeof Problem,
    private rolesService: RolesService,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateProblemsDto, image: Express.Multer.File) {
    try {
      const problem = await this.problemRepository.create(dto);
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      return problem;
    } catch (error) {
      console.error('Ошибка при создании неполадки:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getAll(companyId: string) {
    try {
      const problems = await this.problemRepository.findAll({
        where: { companyId },
        include: { all: true },
      });
      return problems;
    } catch (error) {
      console.error('Ошибка при получении неполадок:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async getById(id: string) {
    try {
      const problem = await this.problemRepository.findOne({ where: { id } });
      return problem;
    } catch (error) {
      console.error('Ошибка при получении неполадки:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async update(id: string, dto: CreateProblemsDto, image: Express.Multer.File) {
    try {
      const problem = await this.problemRepository.findOne({ where: { id } });
      if (!problem) {
        throw new Error('Неполадка не найден');
      }
      if (image) {
        const fileName = await this.fileService.createFile(image);
        dto.image = fileName;
      }
      Object.assign(problem, dto);
      await problem.save();
      return problem;
    } catch (error) {
      console.error('Ошибка при обновлении неполадки:', error);
      throw new InternalServerErrorException(error.message);
    }
  }

  async delete(id: string) {
    try {
      const problem = await this.problemRepository.findOne({ where: { id } });
      if (!problem) {
        throw new Error('Неполадка не найден');
      }
      await problem.destroy();
      return problem;
    } catch (error) {
      console.error('Ошибка при удалении неполадки:', error);
      throw new InternalServerErrorException(error.message);
    }
  }
}
