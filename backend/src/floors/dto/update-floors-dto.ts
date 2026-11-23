import { IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateFloorsDto {
  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  readonly name?: string;

  @IsOptional()
  @IsNumber({}, { message: 'Должно быть числом' })
  readonly number?: number;

  @IsOptional()
  @IsString({ message: 'Должно быть строкой' })
  readonly planData?: string;
}
