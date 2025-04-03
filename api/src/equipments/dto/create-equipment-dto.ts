import { IsEmail, IsNumber, IsString, Length } from 'class-validator';

export class CreateEquipmentDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly name: string;
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly inventoryNumber: string;
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly type: string;
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly description: string;
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly cost: number;
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly maxWarranty: number;
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly currentWarranty: number;
  @IsString({ message: 'Должно быть строкой' })
  readonly state: string;
  @IsString({ message: 'Должно быть строкой' })
  image: string;
  @IsString({ message: 'Должно быть строкой' })
  userId: string;
  @IsString({ message: 'Должно быть строкой' })
  floorId: string;
  @IsString({ message: 'Должно быть строкой' })
  officeId: string;
  @IsString({ message: 'Должно быть строкой' })
  companyId: string;
}
