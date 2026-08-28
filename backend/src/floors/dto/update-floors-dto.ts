import { IsNumber, IsString } from 'class-validator';

export class UpdateFloorsDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly name: string;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly number: number;
}
