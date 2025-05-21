import { IsBoolean, IsNumber, IsString } from 'class-validator';

export class CreateReservedDto {
  endTime: string;
  startTime: string;
  date: string;
  equipmentId: string;
  userId: string;
}
