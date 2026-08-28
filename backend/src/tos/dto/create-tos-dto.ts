import { IsString } from 'class-validator';

export class CreateTosDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  image?: string;
  userId?: string;
  equipmentId?: string;
  companyId?: string;
  problemId?: string;
}
