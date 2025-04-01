import { IsEmail, IsString, Length } from 'class-validator';

export class CreateCompanyDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly name: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly phone: string;

  @IsEmail({}, { message: 'Некорректный email' })
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly email: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly inn: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly adress: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly image: string;
}
