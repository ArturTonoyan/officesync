import { IsString } from 'class-validator';

export class CreateProblemsDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  image?: string;

  userId?: string;
  equipmentId?: string;
  companyId?: string;
}
