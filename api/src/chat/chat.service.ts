import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/sequelize';
import { AskChatDto } from './dto/ask-chat.dto';
import { Company } from 'src/companies/companies.model';
import { Office } from 'src/offices/offices.model';
import { Floors } from 'src/floors/floors.model';
import { User } from 'src/users/users.model';
import { Equipment } from 'src/equipments/equipments.model';
import { Problem } from 'src/problems/problems.model';
import { To } from 'src/tos/tos.model';

type ChatTopic =
  | 'company'
  | 'offices'
  | 'floors'
  | 'users'
  | 'equipments'
  | 'problems'
  | 'tos';

@Injectable()
export class ChatService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(Company) private readonly companyRepository: typeof Company,
    @InjectModel(Office) private readonly officeRepository: typeof Office,
    @InjectModel(Floors) private readonly floorRepository: typeof Floors,
    @InjectModel(User) private readonly userRepository: typeof User,
    @InjectModel(Equipment)
    private readonly equipmentRepository: typeof Equipment,
    @InjectModel(Problem) private readonly problemRepository: typeof Problem,
    @InjectModel(To) private readonly toRepository: typeof To,
  ) {}

  async ask(dto: AskChatDto, companyId?: string) {
    const topic = dto.topic as ChatTopic;
    const question = dto.question.trim();

    if (!question) {
      throw new BadRequestException('Вопрос не может быть пустым');
    }

    const topicData = await this.getTopicData(topic, companyId);
    const preparedData = this.prepareContextData(topicData);

    const answer = await this.askGroq({
      topic,
      question,
      contextData: preparedData,
    });

    return {
      topic,
      recordsCount: Array.isArray(topicData) ? topicData.length : 1,
      answer,
    };
  }

  private async getTopicData(topic: ChatTopic, companyId?: string) {
    switch (topic) {
      case 'company': {
        if (companyId) {
          return this.companyRepository.findOne({ where: { id: companyId } });
        }
        return this.companyRepository.findAll({ limit: 100 });
      }
      case 'offices': {
        return this.officeRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'floors': {
        return this.floorRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'users': {
        return this.userRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'equipments': {
        return this.equipmentRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'problems': {
        return this.problemRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      case 'tos': {
        return this.toRepository.findAll({
          where: companyId ? { companyId } : undefined,
          include: { all: true },
          limit: 100,
        });
      }
      default:
        throw new BadRequestException('Неизвестная тема для чата');
    }
  }

  private prepareContextData(data: any) {
    const convertRecord = (record: any) => {
      const plain = record?.toJSON ? record.toJSON() : record;
      return this.sanitizeObject(plain, 2);
    };

    const prepared = Array.isArray(data)
      ? data.map(convertRecord)
      : convertRecord(data);

    const stringified = JSON.stringify(prepared, null, 2);
    return stringified.length > 18000
      ? `${stringified.slice(0, 18000)}\n... [Данные обрезаны из-за лимита]`
      : stringified;
  }

  private sanitizeObject(value: any, depth: number) {
    if (value === null || value === undefined) {
      return value;
    }

    if (typeof value !== 'object') {
      return value;
    }

    if (Array.isArray(value)) {
      return value
        .slice(0, 20)
        .map((item) => this.sanitizeObject(item, depth - 1));
    }

    if (depth < 0) {
      return '[nested]';
    }

    const blockedKeys = new Set(['password', 'createdAt', 'updatedAt']);
    const result: Record<string, any> = {};

    Object.keys(value).forEach((key) => {
      if (blockedKeys.has(key)) {
        return;
      }
      result[key] = this.sanitizeObject(value[key], depth - 1);
    });

    return result;
  }

  private async askGroq(params: {
    topic: ChatTopic;
    question: string;
    contextData: string;
  }) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    const model =
      this.configService.get<string>('GROQ_MODEL') || 'openai/gpt-oss-120b';

    if (!apiKey) {
      throw new InternalServerErrorException(
        'Не задан GROQ_API_KEY в переменных окружения',
      );
    }

    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          messages: [
            {
              role: 'system',
              content:
                'Ты корпоративный ассистент. Отвечай строго на русском языке, коротко и по делу. Не выдумывай факты. Если данных в контексте не хватает, честно сообщи об этом.',
            },
            {
              role: 'user',
              content: `Тема: ${params.topic}\n\nКонтекст данных:\n${params.contextData}\n\nВопрос: ${params.question}`,
            },
          ],
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new InternalServerErrorException(
        `Ошибка Groq: ${response.status} ${errorText}`,
      );
    }

    const data = await response.json();
    return data?.choices?.[0]?.message?.content || 'Ответ не получен';
  }
}
