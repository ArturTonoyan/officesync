import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class FurnishRoomDto {
  @IsString()
  id: string;

  @IsString()
  name: string;

  @IsString()
  role: string;

  @IsNumber()
  areaM2: number;

  @IsArray()
  @IsString({ each: true })
  existingKinds: string[];
}

export class CatalogItemDto {
  @IsString()
  kind: string;

  @IsString()
  label: string;

  @IsOptional()
  @IsString()
  category?: string;
}

export class FurnishPreferencesDto {
  @IsOptional()
  @IsBoolean()
  morePlants?: boolean;

  @IsOptional()
  @IsBoolean()
  allowExtraFurniture?: boolean;

  @IsOptional()
  @IsBoolean()
  moreFocusBooths?: boolean;
}

export class FurnishRoomsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FurnishRoomDto)
  rooms: FurnishRoomDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CatalogItemDto)
  catalog: CatalogItemDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FurnishPreferencesDto)
  preferences?: FurnishPreferencesDto;
}
