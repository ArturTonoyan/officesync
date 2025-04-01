import {
  Body,
  Controller,
  Get,
  Post,
  Put,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user-dto';
import { UsersService } from './users.service';
// import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { Roles } from 'src/auth/roles-auth-decorator';
import { RolesGuard } from 'src/auth/roles-guard';
import { AddRoleDto } from './dto/add-role.dto';
import { ValidationPipe } from 'src/pipes/validation.pipe';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user-dto';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}
  @Post()
  @UsePipes(ValidationPipe)
  create(@Body() userDto: CreateUserDto) {
    return this.usersService.createUser(userDto);
  }

  @Roles('ADMIN') //! ограничение по ролям
  // @UseGuards(JwtAuthGuard) //! ограничиваем доступ неавторизованным пользователям
  @UseGuards(RolesGuard)
  @Get()
  getAll() {
    return this.usersService.getAllUsers();
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getOne(@Req() request: any) {
    const userId = request.user.id; // Извлечение ID пользователя из токена
    return this.usersService.getOneUser(userId); // Обновление пользователя
  }

  @Roles('ADMIN')
  @UseGuards(RolesGuard)
  @Post('/role')
  addRole(@Body() dto: AddRoleDto) {
    return this.usersService.addRole(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me')
  @UseInterceptors(FileInterceptor('image')) // Используем FileInterceptor для обработки файла
  async updateUser(
    @Req() request: any,
    @Body() updateUserDto: UpdateUserDto,
    @UploadedFile() image: Express.Multer.File, // Получаем файл изображения
  ) {
    const userId = request.user.id; // Извлечение ID пользователя из токена
    return this.usersService.updateUser(userId, updateUserDto, image); // Обновление пользователя
  }
}
