import {
  BadRequestException,
  Body,
  Controller,
  Logger,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { AskChatDto } from './dto/ask-chat.dto';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('ask')
  @UseGuards(JwtAuthGuard)
  async ask(@Body() dto: AskChatDto, @Req() request: any) {
    const companyId = request?.user?.companyId;

    if (!dto?.topic || !dto?.question) {
      this.logger.warn(
        'Invalid chat request payload: topic/question are required',
      );
      throw new BadRequestException('Требуются поля topic и question');
    }

    this.logger.log(
      `Chat request started topic=${dto.topic}, companyId=${companyId || 'n/a'}`,
    );

    return this.chatService.ask(dto, companyId);
  }
}
