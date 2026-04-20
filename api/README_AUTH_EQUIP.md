# Описание основных функций: авторизация и добавление оборудования

## Авторизация (login/register)

Контроллер: auth.controller.ts

### Контроллер авторизации (auth.controller.ts)

```ts
import { Body, Controller, Post } from '@nestjs/common';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  login(@Body() userDto: CreateUserDto) {
    return this.authService.login(userDto);
  }

  @Post('register')
  register(@Body() userDto: CreateUserDto) {
    return this.authService.registration(userDto);
  }
}
```

### AuthService (auth.service.ts)

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from 'src/users/dto/create-user-dto';
import { UsersService } from 'src/users/users.service';
import * as bcrypt from 'bcryptjs';
import { User } from 'src/users/users.model';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(userDto: CreateUserDto) {
    const user = await this.validateUser(userDto);
    return this.generateToken(user);
  }

  async registration(userDto: CreateUserDto) {
    const candidate = await this.usersService.getUserByEmail(userDto.email);
    if (candidate) {
      throw new Error('Пользователь с таким email уже существует');
    }
    const hashPassword = await bcrypt.hash(userDto.password, 5);
    const user = await this.usersService.createUser({
      ...userDto,
      password: hashPassword,
    });
    return this.generateToken(user);
  }

  private async generateToken(user: User) {
    const payload = {
      email: user.email,
      id: user.id,
      roles: user.roles,
      officeId: user.officeId,
      companyId: user.companyId,
      floorId: user.floorId,
    };
    return {
      token: this.jwtService.sign(payload),
    };
  }

  private async validateUser(userDto: CreateUserDto) {
    const user = await this.usersService.getUserByEmail(userDto.email);
    if (!user) {
      throw new UnauthorizedException({
        message: 'Некорректный email или пароль',
      });
    }
    const passwordEquals = await bcrypt.compare(
      userDto.password,
      user.password,
    );
    if (user && passwordEquals) {
      return user;
    }
    throw new UnauthorizedException({
      message: 'Некорректный email или пароль',
    });
  }
}
```

### UsersService (фрагмент)

```ts
async createUser(dto: CreateUserDto) {
  const user = await this.userRepository.create(dto);
  let role = await this.rolesService.getRoleByValue(dto.role);
  await user.$set('roles', [role.id]);
  user.roles = [role];
  return user;
}
```

## Добавление оборудования

Контроллер: equipments.controller.ts

### Контроллер оборудования (equipments.controller.ts)

```ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { EquipmentsService } from './equipments.service';
import { CreateEquipmentDto } from './dto/create-equipment-dto';
import { Roles } from 'src/auth/roles-auth-decorator';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('equipments')
export class EquipmentsController {
  constructor(private equipmentsService: EquipmentsService) {}

  @Roles('ADMIN')
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  create(
    @Body() dto: CreateEquipmentDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.equipmentsService.create(dto, image);
  }

  @Roles('ADMIN')
  @Get('/all/:id')
  getAllByCompanyId(@Param('id') id: string) {
    return this.equipmentsService.getAllByCompany(id);
  }

  @Put(':id')
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id') id: string,
    @Body() dto: CreateEquipmentDto,
    @UploadedFile() image: Express.Multer.File,
  ) {
    return this.equipmentsService.update(id, dto, image);
  }

  @Roles('ADMIN')
  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.equipmentsService.delete(id);
  }
}
```

### EquipmentsService (equipments.service.ts)

```ts
import { Injectable } from '@nestjs/common';
import { Equipment } from './equipments.model';
import { InjectModel } from '@nestjs/sequelize';
import { CreateEquipmentDto } from './dto/create-equipment-dto';

@Injectable()
export class EquipmentsService {
  constructor(
    @InjectModel(Equipment) private equipmentRepository: typeof Equipment,
    private fileService: FilesService,
  ) {}

  async create(dto: CreateEquipmentDto, image: Express.Multer.File) {
    if (image) {
      const fileName = await this.fileService.createFile(image);
      dto.image = fileName;
    }
    const equipment = await this.equipmentRepository.create(dto);
    return equipment;
  }

  async getAllByCompany(id: string) {
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
```

### Модель оборудования (equipments.model.ts, фрагмент)

```ts
@Table({ tableName: 'equipments' })
export class Equipment extends Model<Equipment, EquipmentCreationAttrs> {
  @Column({
    type: DataType.UUID,
    defaultValue: DataType.UUIDV4,
    primaryKey: true,
  })
  id: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  inventoryNumber: string;

  @Column({ type: DataType.STRING, allowNull: true })
  type: string;

  @Column({ type: DataType.STRING, allowNull: true })
  description: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  cost: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  maxWarranty: number;

  @Column({ type: DataType.INTEGER, allowNull: true })
  currentWarranty: number;

  @Column({ type: DataType.STRING, allowNull: true })
  state: string;

  @Column({ type: DataType.STRING, allowNull: true })
  image: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.UUID, allowNull: false })
  userId: string;

  @ForeignKey(() => Floors)
  @Column({ type: DataType.UUID, allowNull: false })
  floorId: string;

  @ForeignKey(() => Office)
  @Column({ type: DataType.UUID, allowNull: false })
  officeId: string;

  @ForeignKey(() => Company)
  @Column({ type: DataType.UUID, allowNull: false })
  companyId: string;

  // ...
}
```

## DTO для пользователя и оборудования

floorId: string;
officeId: string;
companyId: string;

```ts
// CreateUserDto
export class CreateUserDto {
  @IsString({ message: 'Должно быть строкой' })
  @IsEmail({}, { message: 'Некорректный email' })
  readonly email: string;
  @Length(3, 16, { message: 'Пароль должен быть от 4 до 16 символов' })
  readonly password: string;
  @IsString({ message: 'Должно быть строкой' })
  role: string;
  roleId: string;
}

// CreateEquipmentDto
export class CreateEquipmentDto {
  @IsString({ message: 'Должно быть строкой' })
  readonly name: string;
  @IsString({ message: 'Должно быть строкой' })
  readonly inventoryNumber: string;
  @IsString({ message: 'Должно быть строкой' })
  readonly type: string;
  @IsString({ message: 'Должно быть строкой' })
  readonly description: string;
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly cost: number;
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly maxWarranty: number;
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly currentWarranty: number;
  @IsString({ message: 'Должно быть строкой' })
  readonly state: string;
  @IsString({ message: 'Должно быть строкой' })
  image: string;
  @IsString({ message: 'Должно быть строкой' })
  userId: string;
  @IsString({ message: 'Должно быть строкой' })
  floorId: string;
  @IsString({ message: 'Должно быть строкой' })
  officeId: string;
  @IsString({ message: 'Должно быть строкой' })
  companyId: string;
}
```

---

**Кратко:**

- Авторизация: email+пароль, JWT, валидация, bcrypt.
- Добавление оборудования: только ADMIN, с файлом, все поля через DTO, запись в базу.
