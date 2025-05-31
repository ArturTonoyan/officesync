import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { User } from './users.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateUserDto } from './dto/create-user-dto';
import { RolesService } from 'src/roles/roles.service';
import { AddRoleDto } from './dto/add-role.dto';
import { UpdateUserDto } from './dto/update-user-dto';
import { FilesService } from 'src/files/files.service';
import { Role } from 'src/roles/roles.model';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User) private userRepository: typeof User,
    private rolesService: RolesService,
    private fileService: FilesService,
  ) {}

  async createUser(dto: CreateUserDto) {
    const user = await this.userRepository.create(dto);
    let role;
    role = await this.rolesService.getRoleByValue(dto.role);
    await user.$set('roles', [role.id]);
    user.roles = [role];
    return user;
  }

  async createUserAdmin(dto: CreateUserDto) {
    const candidate = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (candidate) {
      throw new HttpException(
        'Пользователь с таким email уже существует',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!dto.roleId) {
      throw new HttpException('Роль не указана', HttpStatus.BAD_REQUEST);
    }
    const hashPassword = await bcrypt.hash(dto.password, 5);
    const user = await this.userRepository.create({
      ...dto,
      password: hashPassword,
    });

    const role = await this.rolesService.getRoleById(dto.roleId);
    await user.$set('roles', [role.id]);
    user.roles = [role];

    return user;
  }

  async getAllByCompany(id: string) {
    console.log('id', id);
    //! { include: { all: true } } все поля с которыми связан пользователь подтягиваются в респонс
    const users = await this.userRepository.findAll({
      where: { companyId: id },
      include: { all: true },
    });
    return users;
  }

  async getOneUser(id: string) {
    //! { include: { all: true } } все поля с которыми связан пользователь подтягиваются в респонс
    const user = await this.userRepository.findOne({
      where: { id },
      include: { all: true },
    });
    return user;
  }

  //! посик пользователя по емаилу
  async getUserByEmail(email: string) {
    const user = await this.userRepository.findOne({
      where: { email },
      include: { all: true },
    });
    return user;
  }

  async addRole(dto: AddRoleDto) {
    //! получаем юзера по id
    const user = await this.userRepository.findByPk(dto.userId);
    //! получаем роль
    const role = await this.rolesService.getRoleByValue(dto.value);
    if (role && user) {
      await user.$add('roles', role.id);
      return dto;
    }
    throw new HttpException(
      'Пользователь или роль не найдены',
      HttpStatus.NOT_FOUND,
    );
  }

  async updateUser(
    id: string,
    updateUserDto: UpdateUserDto,
    image: Express.Multer.File,
  ): Promise<User> {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Пользователь не найден'); // Обработка ошибки, если пользователь не найден
    }

    // Если изображение передано, обрабатываем его
    if (image) {
      const fileName = await this.fileService.createFile(image); // Сохранение файла и получение имени
      updateUserDto.image = fileName; // Обновление DTO с именем файла
    }

    // Обновление полей пользователя
    Object.assign(user, updateUserDto);
    await user.save(); // Сохранение обновленного пользователя
    return user;
  }

  async removeUser(id: string) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Пользователь не найден'); // Обработка ошибки, если пользователь не найден
    }
    await user.destroy(); // Удаление пользователя
    return user;
  }

  async updateUserId(id: string, dto: UpdateUserDto) {
    const user = await User.findByPk(id);
    if (!user) {
      throw new Error('Пользователь не найден'); // Обработка ошибки, если пользователь не найден
    }
    console.log('updateUserDto', dto);
    Object.assign(user, dto);
    if (dto.roleId) {
      const role = await Role.findByPk(dto.roleId);
      if (!role) {
        throw new Error('Роль не найдена');
      }
      await user.$set('roles', [role.id]); // Используйте $set для обновления ролей
    }
    await user.save(); // Сохранение обновленного пользователя
    return user;
  }
}
