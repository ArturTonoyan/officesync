import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Element } from './elements.model';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { CreateElementDto } from './dto/create-element-dto';

@Injectable()
export class ElementsService {
  constructor(
    @InjectModel(Element) private elementRepository: typeof Element,
    private rolesService: RolesService,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateElementDto, image: Express.Multer.File) {
    if (image) {
      const fileName = await this.fileService.createFile(image); // Сохранение файла и получение имени
      dto.image = fileName; // Обновление DTO с именем файла
    }
    const element = await this.elementRepository.create(dto);
    return element;
  }

  async getAllByFloor(id: string) {
    const elements = await this.elementRepository.findAll({
      where: { floorId: id },
    });
    return elements;
  }

  async update(id: string, dto: CreateElementDto, image: Express.Multer.File) {
    if (image) {
      const fileName = await this.fileService.createFile(image); // Сохранение файла и получение имени
      dto.image = fileName; // Обновление DTO с именем файла
    }
    const element = await this.elementRepository.update(dto, { where: { id } });
    return element;
  }

  async delete(id: string) {
    const element = await this.elementRepository.destroy({ where: { id } });
    return element;
  }
}
