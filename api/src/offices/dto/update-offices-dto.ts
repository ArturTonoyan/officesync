import { IsEmail, IsString } from 'class-validator';

export class UpdateOfficesDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly name: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly phone?: string;

  @IsEmail({}, { message: 'Некорректный email' })
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly email?: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly address?: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly directorId?: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  image?: string;
}
