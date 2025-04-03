import { Injectable } from '@nestjs/common';
import { Equipment } from './equipments.model';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { InjectModel } from '@nestjs/sequelize';
import { CreateEquipmentDto } from './dto/create-equipment-dto';

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectModel(Equipment) private equipmentRepository: typeof Equipment,
    private rolesService: RolesService,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateEquipmentDto, image: Express.Multer.File) {
    if (image) {
      const fileName = await this.fileService.createFile(image); // Сохранение файла и получение имени
      dto.image = fileName; // Обновление DTO с именем файла
    }
    const equipment = await this.equipmentRepository.create(dto);
    return equipment;
  }

  async getAllByCompany(id: string) {
    console.log('id', id);
    const equipment = await this.equipmentRepository.findAll({
      where: { companyId: id },
      include: { all: true },
    });
    return equipment;
  }

  async update(
    id: string,
    dto: CreateEquipmentDto,
    image: Express.Multer.File,
  ) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      throw new Error('Оборудование не найдено');
    }
    if (image) {
      const fileName = await this.fileService.createFile(image);
      dto.image = fileName;
    }
    Object.assign(equipment, dto);
    await equipment.save();
    return equipment;
  }

  async delete(id: string) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      throw new Error('Оборудование не найдено');
    }
    await equipment.destroy();
    return equipment;
  }
}
