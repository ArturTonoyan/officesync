import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class EditScopeItemDto {
  @IsString()
  kind: string;

  @IsString()
  id: string;

  @IsOptional()
  @IsString()
  label?: string;
}

export class EditScopeDto {
  @IsString()
  type: 'global' | 'room' | 'selection';

  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  roomName?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EditScopeItemDto)
  items?: EditScopeItemDto[];
}

export class CatalogItemDto {
  @IsString()
  kind: string;

  @IsOptional()
  @IsString()
  label?: string;
}

/** Мебель уже на плане (в комнате / выделении) — чтобы LLM видела ids и kind */
export class ExistingFurnitureDto {
  @IsString()
  id: string;

  @IsString()
  kind: string;

  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsNumber()
  x?: number;

  @IsOptional()
  @IsNumber()
  y?: number;

  @IsOptional()
  @IsNumber()
  rotation?: number;
}

export class ParseEditDto {
  @IsString()
  text: string;

  @ValidateNested()
  @Type(() => EditScopeDto)
  scope: EditScopeDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  catalogKinds?: string[];

  /** kind + русская подпись — чтобы модель не путала проектор с растением */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogItemDto)
  catalog?: CatalogItemDto[];

  /** Текущая мебель в scope (комната / выделение) */
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExistingFurnitureDto)
  existingFurniture?: ExistingFurnitureDto[];

  @IsOptional()
  @IsNumber()
  areaM2?: number;
}
