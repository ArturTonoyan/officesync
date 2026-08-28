import { IsOptional, IsString } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  name?: string;

  @IsString()
  surname?: string;

  @IsString()
  patronymic?: string;

  image?: string;

  @IsString()
  roleId?: string;
}
