import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Element } from './elements.model';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { CreateElementDto } from './dto/create-element-dto';
import { UpdateElementDto } from './dto/update-element-dto';
import { ElementsReserved } from './elements-reserved.model';
import { Sequelize } from 'sequelize-typescript';
import { CreateReservedDto } from './dto/create-reserved-dto';
import { User } from 'src/users/users.model';
import { Equipment } from 'src/equipments/equipments.model';

@Injectable()
export class ElementsService {
  constructor(
    @InjectModel(Element) private elementRepository: typeof Element,
    private fileService: FilesService,
    @InjectModel(ElementsReserved)
    private readonly elementsReservedRepository: typeof ElementsReserved,
    private readonly sequelize: Sequelize,
  ) {}

  async create(dto: CreateElementDto, image: Express.Multer.File) {
    if (image) {
      const fileName = await this.fileService.createFile(image); // Сохранение файла и получение имени
      dto.image = fileName; // Обновление DTO с именем файла
    }
    const element = await this.elementRepository.create(dto);
    return element;
  }

  async createMany(dtos: UpdateElementDto[]) {
    const createdElements = [];

    for (const dto of dtos) {
      const el = await this.elementRepository.findOne({
        where: { id: dto.id },
      });
      let element;

      if (el) {
        await this.elementRepository.update(dto, {
          where: { id: dto.id },
        });
        // повторно получаем обновлённый объект
        element = await this.elementRepository.findOne({
          where: { id: dto.id },
        });
      } else {
        element = await this.elementRepository.create(dto);
      }

      createdElements.push(element);
    }

    return createdElements;
  }

  async getAllByFloor(id: string) {
    const elements = await this.elementRepository.findAll({
      where: { floorId: id },
      include: [
        {
          model: Equipment,
          include: [
            {
              model: User, // замени на свой класс модели пользователя
            },
          ],
        },
        ElementsReserved,
        // другие ассоциации, если нужно
      ],
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

  async createReserved(dto: CreateReservedDto) {
    console.log('dto', dto);
    const element = await this.elementsReservedRepository.create(dto);
    return element;
  }

  async getReserveds(date: string, elementId: string) {
    let reserveds = [];
    if (!date || !elementId) {
      reserveds = await this.elementsReservedRepository.findAll({
        include: { all: true },
      });
    } else {
      reserveds = await this.elementsReservedRepository.findAll({
        where: { date, elementId },
        include: { all: true },
      });
    }

    return reserveds;
  }

  async getReservedsElement(elementId: string) {
    const reserveds = await this.elementsReservedRepository.findAll({
      where: { elementId },
      include: { all: true },
    });
    return reserveds;
  }

  async getMyReserveds(userId: string) {
    console.log('userId', userId);
    const reserveds = await this.elementsReservedRepository.findAll({
      where: { userId },
      include: { all: true },
    });
    return reserveds;
  }

  async deleteReserved(id: string) {
    const element = await this.elementsReservedRepository.destroy({
      where: { id },
    });
    return element;
  }
}
