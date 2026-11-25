import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { FurnishRoomsDto } from './dto/furnish-rooms.dto';
import { ParseEditDto } from './dto/parse-edit.dto';
import { LayoutService } from './layout.service';

@Controller('layout')
export class LayoutController {
  constructor(private readonly layoutService: LayoutService) {}

  @Get('ollama-status')
  @UseGuards(JwtAuthGuard)
  status() {
    return this.layoutService.status();
  }

  @Post('furnish-rooms')
  @UseGuards(JwtAuthGuard)
  furnishRooms(@Body() dto: FurnishRoomsDto) {
    return this.layoutService.furnishRooms(dto);
  }

  @Post('parse-edit')
  @UseGuards(JwtAuthGuard)
  parseEdit(@Body() dto: ParseEditDto) {
    return this.layoutService.parseEdit(dto);
  }
}
