import { Injectable, OnModuleInit } from '@nestjs/common';
import { CreateRoleDto } from './dto/create-role.dto';
import { InjectModel } from '@nestjs/sequelize';
import { Role } from './roles.model';

@Injectable()
export class RolesService implements OnModuleInit {
  constructor(@InjectModel(Role) private roleRepository: typeof Role) {}

  async onModuleInit() {
    await this.createDefaultRoles();
  }

  private async createDefaultRoles() {
    const roles: CreateRoleDto[] = [
      { value: 'ADMIN', description: 'Администратор' },
      { value: 'USER', description: 'Пользователь' },
      { value: 'DIRECTOR', description: 'Директор офиса' },
      // Добавьте другие роли по необходимости
    ];

    for (const role of roles) {
      await this.roleRepository.findOrCreate({
        where: { value: role.value },
        defaults: role,
      });
    }
  }

  async createRole(dto: CreateRoleDto) {
    const role = await this.roleRepository.create(dto);
    return role;
  }

  async getRoleByValue(value: string) {
    const role = await this.roleRepository.findOne({ where: { value } });
    return role;
  }

  async getAll() {
    const roles = await this.roleRepository.findAll();
    return roles;
  }
}
