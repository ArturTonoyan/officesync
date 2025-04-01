import { IsEmail, IsString, Length } from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  @IsEmail({}, { message: 'Некорректный email' })
  readonly email: string;
  @Length(4, 16, { message: 'Пароль должен быть от 4 до 16 символов' })
  readonly password: string;
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  role: string;
}
