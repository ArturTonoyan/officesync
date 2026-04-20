import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Equipment } from './equipments.model';
import { RolesService } from 'src/roles/roles.service';
import { FilesService } from 'src/files/files.service';
import { InjectModel } from '@nestjs/sequelize';
import { CreateEquipmentDto } from './dto/create-equipment-dto';

@Injectable()
export class EquipmentsService {
  private readonly logger = new Logger(EquipmentsService.name);

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
    this.logger.log(
      `Equipment created id=${equipment.id}, companyId=${equipment.companyId}`,
    );
    return equipment;
  }

  async getAllByCompany(id: string) {
    const equipment = await this.equipmentRepository.findAll({
      where: { companyId: id },
      include: { all: true },
    });

    this.logger.log(
      `Equipments fetched companyId=${id}, count=${equipment.length}`,
    );
    return equipment;
  }

  async update(
    id: string,
    dto: CreateEquipmentDto,
    image: Express.Multer.File,
  ) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      this.logger.warn(`Equipment update failed. Not found id=${id}`);
      throw new NotFoundException('Оборудование не найдено');
    }
    if (image) {
      const fileName = await this.fileService.createFile(image);
      dto.image = fileName;
    }
    Object.assign(equipment, dto);
    await equipment.save();
    this.logger.log(`Equipment updated id=${id}`);
    return equipment;
  }

  async delete(id: string) {
    const equipment = await Equipment.findByPk(id);
    if (!equipment) {
      this.logger.warn(`Equipment delete failed. Not found id=${id}`);
      throw new NotFoundException('Оборудование не найдено');
    }
    await equipment.destroy();
    this.logger.log(`Equipment deleted id=${id}`);
    return equipment;
  }
}
