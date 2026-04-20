import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AskChatDto } from './dto/ask-chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  async ask(@Body() dto: AskChatDto, @Req() request: any) {
    const companyId = request?.user?.companyId;

    if (!dto?.topic || !dto?.question) {
      throw new BadRequestException('Требуются поля topic и question');
    }

    return this.chatService.ask(dto, companyId);
  }
}
