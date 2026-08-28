import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateElementDto {
  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly name: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  readonly type: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  equipmentId: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  floorId: string;

  @IsString({ message: 'Должно быть строкой' }) //! валидация
  image: string;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly x: number;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly y: number;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly width: number;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly height: number;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly rotation: number;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly scaleX: number;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly scaleY: number;

  @IsNumber({}, { message: 'Должно быть числом' })
  readonly zIndex: number;

  @IsBoolean({ message: 'Должно быть boolean' })
  readonly isLocked: boolean;
}
