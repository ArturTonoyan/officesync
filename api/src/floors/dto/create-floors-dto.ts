import { IsNumber, IsString } from 'class-validator';

export class CreateFloorsDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly name: string;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly number: number;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  officeId: string;
}
