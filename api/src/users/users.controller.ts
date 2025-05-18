import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
  @Post('create')
  createUser(@Body() userDto: CreateUserDto) {
    return this.usersService.createUserAdmin(userDto);
  }

  @Roles('ADMIN') //! ограничение по ролям
  @Get('/all/:id')
  @UseGuards(RolesGuard)
  getAllByCompanyId(@Param('id') id: string) {
    return this.usersService.getAllByCompany(id);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getOne(@Req() request: any) {
    const userId = request.user.id;
    return this.usersService.getOneUser(userId);
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
    console.log('image', image);
    const userId = request.user.id; // Извлечение ID пользователя из токена
    return this.usersService.updateUser(userId, updateUserDto, image); // Обновление пользователя
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.removeUser(id);
  }

  @Roles('ADMIN')
  @Put(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.updateUserId(id, updateUserDto);
  }
}
